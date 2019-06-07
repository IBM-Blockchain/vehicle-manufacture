/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


import { Contract, Param, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName, Roles } from '../../constants';
import { EventType, HistoricOrder, IVehicleDetails, Order, OrderStatus, Policy, PolicyType, UsageEvent, Vehicle, VehicleStatus } from '../assets'; // tslint:disable-line:max-line-length
import { IOptions } from '../assets/options';
import { Insurer, Manufacturer } from '../organizations';
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
        ctx: VehicleManufactureNetContext, ordererId: string, vehicleDetails: IVehicleDetails, options: IOptions,
    ): Promise<Order> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.ORDER_CREATE)) {
            throw new Error(`Only callers with role ${Roles.ORDER_CREATE} can place orders`);
        } else if (participant.orgId !== vehicleDetails.makeId) {
            throw new Error('Callers may only create orders in their organisation');
        }

        const numOrders = await ctx.getOrderList().count();

        const id = generateId(ctx.stub.getTxID(), 'ORDER_' + numOrders);

        const order = new Order(
            id, vehicleDetails, OrderStatus.PLACED, options, ordererId,
            (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000,
        );

        await ctx.getOrderList().add(order);

        ctx.setEvent('PLACE_ORDER', order);

        return order;
    }

    @Transaction(false)
    @Returns('Order[]')
    public async getOrders(ctx: VehicleManufactureNetContext): Promise<Order[]> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();
        if (!participant.hasRole(Roles.ORDER_READ)) {
            throw new Error(`Only callers with role ${Roles.ORDER_READ} can read orders`);
        }

        const orders = await ctx.getOrderList().getAll();

        return orders.filter((order) => {
            return order.madeByOrg(participant.orgId);
        });
    }

    @Transaction(false)
    @Returns('Order')
    public async getOrder(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.ORDER_READ)) {
            throw new Error(`Only callers with role ${Roles.ORDER_READ} can read orders`);
        }

        const order = await ctx.getOrderList().get(orderId);

        if (!order.madeByOrg(participant.orgId)) {
            throw new Error('Callers may only read an order in their organisation');
        }

        return order;
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

    @Transaction()
    @Returns('Order')
    public async scheduleOrderForManufacture(ctx: VehicleManufactureNetContext, orderId: string): Promise<Order> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.ORDER_UPDATE)) {
            throw new Error(`Only callers with role ${Roles.ORDER_UPDATE} can schedule orders for manufacture`);
        }

        const order = await ctx.getOrderList().get(orderId);

        if (!order.madeByOrg(participant.orgId)) {
            throw new Error('Callers may only schedule an order in their organisation for manufacture');
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
    ): Promise<Order> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        if (
            !participant.hasRole(Roles.ORDER_UPDATE) ||
            !participant.hasRole(Roles.VEHICLE_CREATE)
        ) {
            throw new Error(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_CREATE} can register vehicles for orders` // tslint:disable-line
            );
        }

        const order = await ctx.getOrderList().get(orderId);

        if (!order.madeByOrg(participant.orgId)) {
            throw new Error('Callers may only register a vehicle for an order in their organisation');
        }

        const year = new Date(ctx.stub.getTxTimestamp().getSeconds() * 1000).getFullYear();

        if (!Vehicle.validateVin(vin, organization, year)) {
            throw new Error('Invalid VIN supplied');
        }

        order.orderStatus = OrderStatus.VIN_ASSIGNED;
        order.vin = vin;
        await ctx.getOrderList().update(order);

        const vehicle = new Vehicle(
            vin,
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
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (
            !participant.hasRole(Roles.ORDER_UPDATE) ||
            !participant.hasRole(Roles.VEHICLE_UPDATE)
        ) {
            throw new Error(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_CREATE} can assign ownership of vehicles of orders` // tslint:disable-line
            );
        }

        const order = await ctx.getOrderList().get(orderId);

        if (!order.madeByOrg(participant.orgId)) {
            throw new Error('Callers may only assign an owner for a vehicle of an order in their organisation');
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
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.ORDER_UPDATE)) {
            throw new Error(`Only callers with role ${Roles.ORDER_UPDATE} can deliver orders`);
        }

        const order = await ctx.getOrderList().get(orderId);

        if (!order.madeByOrg(participant.orgId)) {
            throw new Error('Callers may only deliver an order in their organisation');
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

        if (!participant.hasRole(Roles.VEHICLE_READ)) {
            throw new Error(`Only callers with role ${Roles.VEHICLE_READ} can get vehicles`);
        }

        let query = {};
        if (organization instanceof Manufacturer) {
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
        const { participant, organization } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.VEHICLE_READ)) {
            throw new Error(`Only callers with role ${Roles.VEHICLE_READ} can get vehicles`);
        }

        const vehicle = await ctx.getVehicleList().get(vin);

        if (organization instanceof Manufacturer && !vehicle.madeByOrg(participant.orgId)) {
            throw new Error('Manufacturers may only get a vehicle produced by their organisation');
        }

        return vehicle;
    }

    @Transaction()
    @Param('endDate', 'number', 'end date as timestamp in seconds')
    @Returns('Policy')
    public async createPolicy(
        ctx: VehicleManufactureNetContext, vin: string, holderId: string, policyType: PolicyType, endDate: number,
    ): Promise<Policy> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.POLICY_CREATE)) {
            throw new Error(`Only callers with role ${Roles.POLICY_CREATE} can create policies`);
        }

        const vehicle = await ctx.getVehicleList().get(vin);

        if (vehicle.vehicleStatus !== VehicleStatus.ACTIVE) {
            throw new Error('Cannot insure vehicle which is not active');
        }

        await ctx.getParticipantList().get(holderId); // will error if no user with ID

        const numPolicies = await ctx.getPolicyList().count();

        const id = generateId(ctx.stub.getTxID(), 'POLICY_' + numPolicies);
        const startDate = (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000;

        const policy = new Policy(id, vin, participant.orgId, holderId, policyType, startDate, endDate);

        await ctx.getPolicyList().add(policy);

        ctx.setEvent('CREATE_POLICY', policy);

        return policy;
    }

    @Transaction(false)
    @Returns('Policy[]')
    public async getPolicies(ctx: VehicleManufactureNetContext) {
        const { participant, organization } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.POLICY_READ)) {
            throw new Error(`Only callers with role ${Roles.POLICY_READ} can read policies`);
        }

        let query = {};
        if (organization instanceof Insurer) {
            query = { selector: { insurerId: organization.id } };
        }

        const policies = await ctx.getPolicyList().query(query);

        return policies;
    }

    @Transaction(false)
    @Returns('Policy')
    public async getPolicy(ctx: VehicleManufactureNetContext, policyId: string): Promise<Policy> {
        const {participant, organization} = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.POLICY_READ)) {
            throw new Error(`Only callers with role ${Roles.POLICY_READ} can read policies`);
        }

        const policy = await ctx.getPolicyList().get(policyId);

        if (!(
            policy.holderId === participant.id ||
            (policy.insurerId === organization.id && organization instanceof Insurer))
        ) {
            throw new Error('Only the holder or the insurer can view a policy');
        }

        return policy;
    }

    @Transaction()
    @Returns('UsageEvent')
    public async addUsageEvent(
        ctx: VehicleManufactureNetContext,
        vin: string,
        eventType: EventType,
        acceleration: number,
        airTemperature: number,
        engineTemperature: number,
        lightLevel: number,
        pitch: number,
        roll: number,
    ): Promise<UsageEvent> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.USAGE_EVENT_CREATE)) {
            throw new Error(`Only callers with role ${Roles.USAGE_EVENT_CREATE} can add usage events`);
        }

        await this.getVehicle(ctx, vin);

        const id = generateId(ctx.stub.getTxID(), eventType.toString());
        const timestamp = (ctx.stub.getTxTimestamp().getSeconds() as any).toInt() * 1000;

        const usageEvent = new UsageEvent(
            id,
            eventType, acceleration, airTemperature, engineTemperature, lightLevel, pitch, roll,
            timestamp, vin,
        );

        await ctx.getUsageList().add(usageEvent);

        ctx.setEvent('ADD_USAGE_EVENT', usageEvent);

        return usageEvent;
    }

    @Transaction(false)
    @Returns('UsageEvent[]')
    public async getUsageEvents(ctx: VehicleManufactureNetContext): Promise<UsageEvent[]> {
        const { participant} = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.USAGE_EVENT_READ)) {
            throw new Error(`Only callers with role ${Roles.USAGE_EVENT_READ} can get usage events`);
        }

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
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.USAGE_EVENT_READ)) {
            throw new Error(`Only callers with role ${Roles.USAGE_EVENT_READ} can add usage events`);
        }

        const usageEvents = await ctx.getUsageList().query({selector: {vin}});

        return usageEvents;
    }

    @Transaction(false)
    @Returns('UsageEvent[]')
    public async getPolicyEvents(ctx: VehicleManufactureNetContext, policyId: string): Promise<UsageEvent[]> {
        const { participant } = await ctx.getClientIdentity().loadParticipant();

        if (!participant.hasRole(Roles.POLICY_READ)) {
            throw new Error(`Only callers with role ${Roles.POLICY_READ} can add usage events`);
        }

        const policy = await ctx.getPolicyList().get(policyId);
        await this.getVehicle(ctx, policy.vin);

        if (!participant.hasRole(Roles.USAGE_EVENT_READ)) {
            throw new Error(`Only callers with role ${Roles.USAGE_EVENT_READ} can add usage events`);
        }

        const usageEvents = await ctx.getUsageList().query({
            selector: {vin: policy.vin, timestamp: {$gte: policy.startDate, $lt: policy.endDate }},
        });
        return usageEvents;
    }
}
