/*
SPDX-License-Identifier: Apache-2.0
*/

import { Contract, Returns, Transaction } from 'fabric-contract-api';
import { newLogger } from 'fabric-shim';
import * as fs from 'fs';
import { NetworkName } from '../../constants';
import { IOptions } from '../assets/options';
import { Order, OrderStatus } from '../assets/order';
import { Vehicle, VehicleStatus } from '../assets/vehicle';
import { IVehicleDetails } from '../assets/vehicleDetails';
import { Organization } from '../organizations/organization';
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
        const manufacturer = await ctx.getClientIdentity().loadOrganization();

        const orders = await ctx.getOrderList().getAll();

        return orders.filter((order) => {
            return order.canBeChangedBy(participant) || order.canBeChangedBy(manufacturer);
        });
    }

    @Transaction()
    @Returns('Order')
    public async updateOrderStatus(
        ctx: VehicleManufactureNetContext, orderId: string, status: OrderStatus, vin?: string,
    ) {
        const manufacturer = await ctx.getClientIdentity().loadOrganization();

        const order = await ctx.getOrderList().get(orderId);

        if (!order.canBeChangedBy(manufacturer)) {
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
            const vehicle = await ctx.getVehicleList().get(vin);
            vehicle.ownerId = order.ordererId;
            await ctx.getVehicleList().update(vehicle);
        }

        await ctx.getOrderList().update(order);
        return order;
    }

    @Transaction(false)
    @Returns('Vehicle[]')
    public async getCars(ctx: VehicleManufactureNetContext): Promise<object[]> {
        const participant = await ctx.getClientIdentity().loadParticipant();

        const vehicles = await ctx.getVehicleList().getAll();

        return vehicles.filter((vehicle) => {
            return vehicle.belongsTo(participant) ||
            (vehicle.madeByOrg(participant) && participant.isManufacturer()) ||
            participant.isRegulator();
        }).map((v: Vehicle) => JSON.parse(v.serialize().toString('utf8')));
    }

    @Transaction(false)
    @Returns('number')
    public async countCars(ctx: VehicleManufactureNetContext): Promise<number> {
        return (await this.getCars(ctx)).length;
    }

    @Transaction()
    public async setupDemo(ctx: VehicleManufactureNetContext): Promise<void> {
        const participant = await ctx.getClientIdentity().loadParticipant();
        if (!participant.canRegister) {
            throw new Error('Participant cannot register new users');
        }
        const vehicleData: any[] = JSON.parse(fs.readFileSync('./../data/vehicles.json').toString());
        const people = ['Paul', 'Andy', 'Hannah', 'Sam', 'Caroline'];

        // await Promise.all(people.map(async (name: string) => {
        //     const loggedInOrganization = await ctx.getClientIdentity().loadOrganization();
    //     const person = new Person(name, 'customer', 'manufacturer', 'A');
        //     return ctx.getPersonList().add(person);
        // }));

        await Promise.all(vehicleData.map((data: any) => {
            const vehiclePromises = [];
            for (const makeId in data) {
                if (data.hasOwnProperty(makeId)) {
                    const vehicles = data[makeId];
                    for (const model in vehicles) {
                        if (vehicles.hasOwnProperty(model)) {
                            const vehicle = vehicles[model];
                            const vehicleResource = new Vehicle(
                                vehicle.vin,
                                {makeId, modelType: model, colour: vehicle.colour},
                                VehicleStatus.ACTIVE,
                                [],
                            );
                            vehiclePromises.push(ctx.getVehicleList().add(vehicleResource));
                        }
                    }
                }
            }
            return vehiclePromises;
        }));
    }

    private validateVin(ctx: VehicleManufactureNetContext, vin: string, manufacturer: Organization): boolean {
        if (manufacturer.orgType !== 'manufacturer') {
            throw new Error('Organization type incorrect');
        }
        const yearChars = [
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y',
            1, 2, 3, 4, 5, 6, 7, 8, 9,
        ];

        const year = new Date(ctx.stub.getTxTimestamp().getSeconds() * 1000).getFullYear();
        const yearChar = yearChars[(year - 1980) % yearChars.length];
        logger.info(JSON.stringify(yearChar));
        return vin.charAt(0) === manufacturer.originCode &&
            vin.charAt(1) === manufacturer.manufacturerCode &&
            vin.charAt(9) === yearChar;
    }
}
