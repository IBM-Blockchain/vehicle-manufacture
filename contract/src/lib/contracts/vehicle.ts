/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Param, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { IOptions } from '../assets/options';
import { HistoricOrder, Order, OrderStatus } from '../assets/order';
import { Policy, PolicyType } from '../assets/policy';
import { EventType, UsageEvent } from '../assets/usageEvents';
import { Vehicle, VehicleStatus } from '../assets/vehicle';
import { IVehicleDetails } from '../assets/vehicleDetails';
import { Insurer } from '../organizations/insurer';
import { Manufacturer } from '../organizations/manufacturer';
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
    public async beforeTransaction(ctx: VehicleManufactureNetContext) {
        await ctx.getClientIdentity().updateParticipant();
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

        const order = new Order(
            id, vehicleDetails, OrderStatus.PLACED, options, participant.id,
            (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000,
        );

        await ctx.getOrderList().add(order);

        ctx.setEvent('PLACE_ORDER', order);

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
    @Returns('HistoricOrder[]')
    public async getOrderHistory(
        ctx: VehicleManufactureNetContext, orderId: string,
    ): Promise<HistoricOrder[]> {
        await this.getOrder(ctx, orderId); // will error if no order, or user cannot access

        const history = await ctx.getOrderList().getHistory(orderId);

        return history;
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

        ctx.setEvent('UPDATE_ORDER', order);
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

        const vehicle = new Vehicle(
            vin,
            telematicId,
            order.vehicleDetails,
            VehicleStatus.OFF_THE_ROAD,
            (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000,
        );

        await ctx.getVehicleList().add(vehicle);

        ctx.setEvent('UPDATE_ORDER', order);

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

        ctx.setEvent('UPDATE_ORDER', order);

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

        ctx.setEvent('UPDATE_ORDER', order);

        return order;
    }

    @Transaction(false)
    @Returns('Vehicle[]')
    public async getVehicles(ctx: VehicleManufactureNetContext): Promise<Vehicle[]> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        let query = {};
        if (participant.isPrivateEntity()) {
            query = { selector: { ownerId: participant.id } };
        } else if (organization instanceof Manufacturer && participant.isEmployee()) {
            query = { selector: { vehicleDetails: { makeId: organization.id } } };
        } else if (organization instanceof Insurer) {
            query = { selector: { id: { $in: (await this.getPolicies(ctx)).map((policy) => policy.vin ) } } };
        }

        const vehicles = await ctx.getVehicleList().query(query);

        return vehicles;
    }

    @Transaction(false)
    @Returns('Vehicle')
    public async getVehicle(ctx: VehicleManufactureNetContext, vin: string): Promise<Vehicle> {
        const {participant} = await ctx.getClientIdentity().loadParticipant();

        const vehicle = await ctx.getVehicleList().get(vin);
        if (!vehicle.belongsTo(participant) && !participant.isEmployee()) {
            // all employees can get vehicles as without private data they could just look through couchDB
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
    @Param('endDate', 'number', 'end date as timestamp in seconds')
    @Returns('Policy')
    public async createPolicy(
        ctx: VehicleManufactureNetContext, vin: string, holderId: string, policyType: PolicyType, endDate: number,
    ): Promise<Policy> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        if (!(organization instanceof Insurer) || !participant.isEmployee()) {
            throw new Error('Only employee\'s of insurers may create new policies');
        }

        const vehicle = await ctx.getVehicleList().get(vin);

        if (vehicle.vehicleStatus !== VehicleStatus.ACTIVE) {
            throw new Error('Cannot insure vehicle which is not active');
        }

        await ctx.getParticipantList().get(holderId); // will error if no user with ID

        const numPolicies = await ctx.getPolicyList().count();

        const id = generateId(ctx.stub.getTxID(), 'POLICY_' + numPolicies);
        const startDate = (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000;

        const policy = new Policy(id, vin, organization.id, holderId, policyType, startDate, endDate);

        await ctx.getPolicyList().add(policy);

        ctx.setEvent('CREATE_POLICY', policy);

        return policy;
    }

    @Transaction(false)
    @Returns('Policy[]')
    public async getPolicies(ctx: VehicleManufactureNetContext) {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        let query = {};
        if (participant.isPrivateEntity()) {
            query = { selector: { holderId: participant.id } };
        } else if (organization instanceof Insurer && participant.isEmployee()) {
            query = { selector: { insurerId: organization.id } };
        }

        const policies = await ctx.getPolicyList().query(query);

        return policies;
    }

    @Transaction(false)
    @Returns('Policy')
    public async getPolicy(ctx: VehicleManufactureNetContext, policyId: string): Promise<Policy> {
        logger.info('GETTING A POLICY' + policyId);

        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        const policy = await ctx.getPolicyList().get(policyId);

        if (!(
            policy.holderId === participant.id ||
            (policy.insurerId === organization.id && organization instanceof Insurer && participant.isEmployee()))
        ) {
            throw new Error('Only the holder or the insurer can view a policy');
        }

        return policy;
    }

    @Transaction()
    @Returns('UsageEvent')
    public async addUsageEvent(
        ctx: VehicleManufactureNetContext,
        eventType: EventType,
        acceleration: number,
        airTemperature: number,
        engineTemperature: number,
        lightLevel: number,
        pitch: number,
        roll: number): Promise<UsageEvent> {
        const {participant} = await ctx.getClientIdentity().loadParticipant();

        if (!(participant instanceof TelematicsDevice)) {
            throw new Error('Usage events can only be added by a telematic device');
        }

        const vehicles = await ctx.getVehicleList().query({selector: {telematicId: participant.id}});

        if (vehicles.length > 1) {
            throw new Error('Multiple vehicles are assigned to the same telematic device');
        }

        const id = generateId(ctx.stub.getTxID(), eventType.toString());
        const timestamp = (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000;

        const usageEvent = new UsageEvent(
            id,
            eventType, acceleration, airTemperature, engineTemperature, lightLevel, pitch, roll,
            timestamp, vehicles[0].id,
        );

        await ctx.getUsageList().add(usageEvent);

        ctx.setEvent('ADD_USAGE_EVENT', usageEvent);

        return usageEvent;
    }

    @Transaction()
    public async removeUsageEvent(ctx: VehicleManufactureNetContext, eventId: string) {
        console.log('EVENT ID', eventId);
        ctx.getUsageList().delete(eventId); // WORK OUT WHY FAIL
    }

    @Transaction(false)
    @Returns('UsageEvent[]')
    public async getUsageEvents(ctx: VehicleManufactureNetContext): Promise<UsageEvent[]> {
        // switch on user then get vehicles they are involved with/policies
        // and get usage events for those. regulator just gets all
        const vehicles = await this.getVehicles(ctx);

        const usageEvents: UsageEvent[][] = await Promise.all(vehicles.map((vehicle) => {
            return this.getVehicleEvents(ctx, vehicle.id);
        }));
        return [].concat.apply([], usageEvents);
    }

    @Transaction(false)
    @Returns('UsageEvent[]')
    public async getVehicleEvents(ctx: VehicleManufactureNetContext, vin: string): Promise<UsageEvent[]> {
        await this.getVehicle(ctx, vin); // throws error if they lack read permission

        const usageEvents = await ctx.getUsageList().query({selector: {vin}});

        return usageEvents;
    }

    @Transaction(false)
    @Returns('UsageEvent[]')
    public async getPolicyEvents(ctx: VehicleManufactureNetContext, policyId: string): Promise<UsageEvent[]> {
        const policy = await ctx.getPolicyList().get(policyId);
        await this.getVehicle(ctx, policy.vin);

        const usageEvents = await ctx.getUsageList().query({
            selector: {vin: policy.vin, timestamp: {$gte: policy.startDate, $lt: policy.endDate }},
        });
        return usageEvents;
    }
}
