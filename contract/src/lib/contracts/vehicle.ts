/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import { NetworkName } from '../../constants';
import { IOptions } from '../assets/options';
import { Order, OrderStatus } from '../assets/order';
import { Vehicle, VehicleStatus } from '../assets/vehicle';
import { IVehicleDetails } from '../assets/vehicleDetails';
import { Manufacturer } from '../participants/manufacturer';
import { Person } from '../participants/person';
import { VehicleManufactureNetContext } from '../utils/context';

const logger = newLogger('VEHICLE');

export class VehicleContract extends Contract {
    constructor() {
        super(NetworkName + '.vehicles');
    }

    public createContext() {
        return new VehicleManufactureNetContext();
    }

    @Transaction()
    public async placeOrder(ctx: VehicleManufactureNetContext, vehicleDetails: IVehicleDetails, options: IOptions) {
        const person = await ctx.getClientIdentity().loadParticipant();

        if (!(person instanceof Person)) {
            throw new Error('Only callers of type Person can place orders');
        }

        const numOrders = await ctx.getOrderList().count();

        const order = new Order('ORDER_' + numOrders, vehicleDetails, OrderStatus.PLACED, options, person.id);

        await ctx.getOrderList().add(order);
    }

    @Transaction(false)
    @Returns('Order[]')
    public async getOrders(ctx: VehicleManufactureNetContext): Promise<Order[]> {
        const participant = await ctx.getClientIdentity().loadParticipant();

        const orders = await ctx.getOrderList().getAll();

        return orders.filter((order) => {
            return order.isOrderer(participant) || order.isManufacturer(participant as Manufacturer);
        });
    }

    @Transaction()
    public async updateOrderStatus(
        ctx: VehicleManufactureNetContext, orderId: string, status: OrderStatus, vin?: string,
    ) {
        const manufacturer = await ctx.getClientIdentity().loadParticipant() as Manufacturer;

        const order = await ctx.getOrderList().get(orderId);

        if (!order.isManufacturer(manufacturer)) {
            throw new Error('Only the manufacturer of an order can update its status');
        }

        order.orderStatus = status;

        if (status === OrderStatus.VIN_ASSIGNED) {
            if (!vin) {
                throw new Error('VIN must be sent when assigning');
            }

            if (!this.validateVin(ctx, vin, manufacturer)) {
                throw new Error('Invalid VIN supplied');
            }

            const vehicle = new Vehicle(vin, order.vehicleDetails, VehicleStatus.OFF_THE_ROAD, []);
            await ctx.getVehicleList().add(vehicle);
        } else if (status === OrderStatus.OWNER_ASSIGNED) {
            const vehicle = await ctx.getVehicleList().get(order.vin);
            vehicle.ownerId = order.ordererId;
            await ctx.getVehicleList().update(vehicle);
        }

        await ctx.getOrderList().update(order);
    }

    @Transaction()
    @Returns('Vehicle[]')
    public async getCars(ctx: VehicleManufactureNetContext): Promise<Vehicle[]> {
        const participant = await ctx.getClientIdentity().loadParticipant();

        const vehicles = await ctx.getVehicleList().getAll();

        return vehicles.filter((vehicle) => {
            return vehicle.isOwner(participant) || vehicle.isManufacturer(participant as Manufacturer);
        });
    }

    @Transaction()
    @Returns('number')
    public async countCars(ctx: VehicleManufactureNetContext): Promise<number> {
        return (await this.getCars(ctx)).length;
    }

    private validateVin(ctx: VehicleManufactureNetContext, vin: string, manufacturer: Manufacturer): boolean {
        const yearChars = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y',
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ];

        const year = new Date(ctx.stub.getTxTimestamp().getSeconds() * 1000).getFullYear();
        const yearChar = yearChars[(year - 1980) % yearChars.length];

        return vin.charAt(0) === manufacturer.originCode &&
            vin.charAt(1) === manufacturer.manufacturerCode &&
            vin.charAt(9) === yearChar;
    }
}
