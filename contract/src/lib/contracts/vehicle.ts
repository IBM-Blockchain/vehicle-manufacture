/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { IOptions } from '../assets/options';
import { Order, OrderStatus } from '../assets/order';
import { Policy, PolicyType } from '../assets/policy';
import { IUsageEvent } from '../assets/usageEvents';
import { Vehicle, VehicleStatus } from '../assets/vehicle';
import { IVehicleDetails } from '../assets/vehicleDetails';
import { Insurer } from '../organizations/insurer';
import { Person } from '../participants/person';
import { TelematicsDevice } from '../participants/telematics';
import { VehicleManufactureNetContext } from '../utils/context';
import { generateId } from '../utils/functions';

const logger = newLogger('VEHICLE');

export class VehicleContract extends Contract {
    constructor() {
        super(NetworkName + '.vehicles');
    }

    public createContext() {
        return new VehicleManufactureNetContext();
    }

    @Transaction()
    @Returns('Order')
    public async placeOrder(
        ctx: VehicleManufactureNetContext, vehicleDetails: IVehicleDetails, options: IOptions,
    ): Promise<Order> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!(participant instanceof Person)) {
            throw new Error('Only callers of type Person can place orders');
        }

        const numOrders = await ctx.getOrderList().count();

        const id = generateId(ctx.stub.getTxID(), 'ORDER_' + numOrders);

        const order = new Order(id, vehicleDetails, OrderStatus.PLACED, options, participant.id);

        await ctx.getOrderList().add(order);

        ctx.stub.setEvent('PLACE_ORDER', order.serialize());

        return order;
    }

    @Transaction(false)
    @Returns('Order[]')
    public async getOrders(ctx: VehicleManufactureNetContext): Promise<Order[]> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const orders = await ctx.getOrderList().getAll();

        return orders.filter((order) => {
            return order.canBeChangedBy(participant, organization);
        });
    }

    @Transaction(false)
    @Returns('Order')
    public async getOrder(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const order = await ctx.getOrderList().get(orderId);
        if (!order.canBeChangedBy(participant, organization)) {
            throw new Error('Only the orderer and manufacturer can access this order');
        }
        return order;
    }

    @Transaction()
    @Returns('Order')
    public async scheduleOrderForManufacture(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const order = await ctx.getOrderList().get(orderId);

        if (!order.canBeChangedBy(participant, organization)) {
            throw new Error('Only the manufacturer of an order can create a car for it');
        }

        order.orderStatus = OrderStatus.SCHEDULED_FOR_MANUFACTURE;
        await ctx.getOrderList().update(order);

        ctx.stub.setEvent('UPDATE_ORDER', order.serialize());
        return order;
    }

    @Transaction()
    @Returns('Order')
    public async registerVehicleForOrder(
        ctx: VehicleManufactureNetContext,
        orderId: string,
        vin: string,
        telematicId: string,
    ): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const order = await ctx.getOrderList().get(orderId);

        if (!order.canBeChangedBy(participant, organization)) {
            throw new Error('Only the manufacturer of an order can create a car for it');
        }

        const year = new Date(ctx.stub.getTxTimestamp().getSeconds() * 1000).getFullYear();

        if (!Vehicle.validateVin(vin, organization, year)) {
            throw new Error('Invalid VIN supplied');
        }

        if (!(await ctx.getParticipantList().exists(telematicId))) {
            throw new Error(`Telematics device ${telematicId} does not exist`);
        }

        const vehicles = await ctx.getVehicleList().query({selector: {telematicId}});

        if (vehicles.length > 0) {
            throw new Error('Telematic device already assigned to vehicle');
        }

        order.orderStatus = OrderStatus.VIN_ASSIGNED;
        order.vin = vin;
        await ctx.getOrderList().update(order);

        const vehicle = new Vehicle(vin, telematicId, order.vehicleDetails, VehicleStatus.OFF_THE_ROAD, []);
        await ctx.getVehicleList().add(vehicle);

        ctx.stub.setEvent('UPDATE_ORDER', order.serialize());

        return order;
    }

    @Transaction()
    @Returns('Order')
    public async assignOwnershipForOrder(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const order = await ctx.getOrderList().get(orderId);

        if (!order.canBeChangedBy(participant, organization)) {
            throw new Error('Only the manufacturer of an order can create a car for it');
        }

        order.orderStatus = OrderStatus.OWNER_ASSIGNED;
        await ctx.getOrderList().update(order);

        const vehicle = await ctx.getVehicleList().get(order.vin);
        vehicle.ownerId = order.ordererId;
        await ctx.getVehicleList().update(vehicle);

        ctx.stub.setEvent('UPDATE_ORDER', order.serialize());

        return order;
    }

    @Transaction()
    @Returns('Order')
    public async deliverOrder(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const order = await ctx.getOrderList().get(orderId);

        if (!order.canBeChangedBy(participant, organization)) {
            throw new Error('Only the manufacturer of an order can create a car for it');
        }

        order.orderStatus = OrderStatus.DELIVERED;
        await ctx.getOrderList().update(order);

        const vehicle = await ctx.getVehicleList().get(order.vin);
        vehicle.ownerId = order.ordererId;
        vehicle.vehicleStatus = VehicleStatus.ACTIVE;
        await ctx.getVehicleList().update(vehicle);

        ctx.stub.setEvent('UPDATE_ORDER', order.serialize());

        return order;
    }

    @Transaction(false)
    @Returns('Vehicle[]')
    public async getVehicles(ctx: VehicleManufactureNetContext): Promise<Vehicle[]> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const vehicles = await ctx.getVehicleList().getAll();

        return vehicles.filter((vehicle) => {
            return vehicle.belongsTo(participant) ||
            (vehicle.madeByOrg(participant) && participant.role === 'employee') ||
            (organization.orgType === 'regulator' && participant.role === 'employee');
        });
    }

    @Transaction(false)
    @Returns('Vehicle')
    public async getVehicle(ctx: VehicleManufactureNetContext, vehicleId: string): Promise<Vehicle> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const vehicle = await ctx.getVehicleList().get(vehicleId);
        if (!(vehicle.belongsTo(participant) ||
        (vehicle.madeByOrg(participant) && participant.role === 'employee') ||
        (organization.orgType === 'regulator' && participant.role === 'employee'))) {
            throw new Error('Only the manufacturer or the owner of the vehicle can view it');
        }
        return vehicle;
    }

    @Transaction(false)
    @Returns('number')
    public async countCars(ctx: VehicleManufactureNetContext): Promise<number> {
        return (await this.getVehicles(ctx)).length;
    }

    @Transaction()
    @Returns('Policy')
    public async createPolicy(
        ctx: VehicleManufactureNetContext, vin: string, holderId: string, policyType: PolicyType,
    ): Promise<Policy> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        if (!(organization instanceof Insurer) || participant.role !== 'employee') {
            throw new Error('Only employee\'s of insurers may create new policies');
        }

        const vehicle = await ctx.getVehicleList().get(vin);

        if (vehicle.vehicleStatus !== VehicleStatus.ACTIVE) {
            throw new Error('Cannot insure vehicle which is not active');
        }

        await ctx.getParticipantList().get(holderId); // will error if no user with ID

        const numPolicies = await ctx.getPolicyList().count();

        const id = generateId(ctx.stub.getTxID(), 'POLICY_' + numPolicies);

        const policy = new Policy(id, vin, organization.id, holderId, policyType);

        await ctx.getPolicyList().add(policy);

        ctx.stub.setEvent('CREATE_POLICY', policy.serialize());

        return policy;
    }

    @Transaction()
    @Returns('Vehicle')
    public async addUsageEvent(ctx: VehicleManufactureNetContext, usageEvent: IUsageEvent): Promise<Vehicle> {
        const {participant} = await ctx.getClientIdentity().loadParticipant();

        if (!(participant instanceof TelematicsDevice)) {
            throw new Error('Usage events can only be added by a telematic device');
        }

        const vehicles = await ctx.getVehicleList().query({selector: {telematicId: participant.id}});

        if (vehicles.length > 1) {
            throw new Error('Multiple vehicles are assigned to the same telematic device');
        }

        usageEvent.eventID = generateId(ctx.stub.getTxID(), usageEvent.eventType.toString());
        usageEvent.timestamp = ctx.stub.getTxTimestamp().getSeconds();

        const vehicle = vehicles[0];
        vehicle.usageRecord.push(usageEvent);

        await ctx.getVehicleList().update(vehicle);

        ctx.stub.setEvent('ADD_USAGE_EVENT', vehicle.serialize());

        return vehicle;
    }
}
