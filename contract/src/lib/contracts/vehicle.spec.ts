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
import * as chai from 'chai';
import { ChaincodeStub } from 'fabric-shim';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Roles } from '../../constants';
import { EventType, Order, OrderStatus, Policy, PolicyType, UsageEvent, Vehicle, VehicleStatus } from '../assets';
import { AssetList, ParticipantList } from '../lists';
import { Insurer, Manufacturer, Organization } from '../organizations';
import { Participant } from '../participants';
import { VehicleManufactureNetClientIdentity } from '../utils/client-identity';
import { VehicleManufactureNetContext } from '../utils/context';
import { VehicleContract as VehicleContractImport } from './vehicle';

chai.should();
chai.use(sinonChai);

describe ('#VehicleContract', () => {
    let VehicleContract;

    let sandbox: sinon.SinonSandbox;
    let contract: VehicleContractImport;
    let ctx: sinon.SinonStubbedInstance<VehicleManufactureNetContext>;
    let stub: sinon.SinonStubbedInstance<ChaincodeStub>;
    let clientIdentity: sinon.SinonStubbedInstance<VehicleManufactureNetClientIdentity>;

    let participantList: sinon.SinonStubbedInstance<ParticipantList>;
    let orderList: sinon.SinonStubbedInstance<AssetList<Order>>;
    let vehicleList: sinon.SinonStubbedInstance<AssetList<Vehicle>>;
    let policyList: sinon.SinonStubbedInstance<AssetList<Policy>>;
    let usageList: sinon.SinonStubbedInstance<AssetList<UsageEvent>>;

    let participant: sinon.SinonStubbedInstance<Participant>;
    let organization: sinon.SinonStubbedInstance<Organization>;

    let generateIdStub: sinon.SinonStub;

    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {
        generateIdStub = sinon.stub();

        mockery.registerMock('../utils/functions', {
            generateId: generateIdStub,
        });

        cleanCache();
        VehicleContract = requireVehicleContract();

        sandbox = sinon.createSandbox();

        contract = new VehicleContract();
        ctx = sinon.createStubInstance(VehicleManufactureNetContext);
        stub = sinon.createStubInstance(ChaincodeStub);
        clientIdentity = sinon.createStubInstance(VehicleManufactureNetClientIdentity);
        participantList = sinon.createStubInstance(ParticipantList);
        orderList = sinon.createStubInstance(AssetList);
        vehicleList = sinon.createStubInstance(AssetList);
        policyList = sinon.createStubInstance(AssetList);
        usageList = sinon.createStubInstance(AssetList);

        organization = sinon.createStubInstance(Organization);
        participant = sinon.createStubInstance(Participant);

        (clientIdentity as any)._participant = participant;
        (clientIdentity as any)._organization = organization;

        (ctx as any)._clientIdentity = clientIdentity;
        (ctx as any).participantList = participantList;
        (ctx as any).vehicleList = vehicleList;
        (ctx as any).policyList = policyList;
        (ctx as any).orderList = orderList;
        (ctx as any).usageList = usageList;
        (ctx as any).stub = stub;
    });

    afterEach(() => {
        sandbox.restore();
    });

    after(() => {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe ('placeOrder', () => {
        const fakeVehicleDetails = {
            colour: 'some colour',
            makeId: 'some make',
            modelType: 'some model',
        };

        const fakeOrder = {
            extras: ['some', 'extra'],
            interior: 'some interior',
            trim: 'some trim',
        };

        it ('should error if the participant lacks the role to create orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_CREATE).returns(false);

            await contract.placeOrder(
                ctx as any, 'some orderer', fakeVehicleDetails, fakeOrder,
            ).should.be.rejectedWith(`Only callers with role ${Roles.ORDER_CREATE} can place orders`);
        });

        it ('should error if the participant is not from the same org as the requested vehicles make', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_CREATE).returns(true);
            (participant as any).orgId = 'not' + fakeVehicleDetails.makeId;

            await contract.placeOrder(
                ctx as any, 'some orderer', fakeVehicleDetails, fakeOrder,
            ).should.be.rejectedWith('Callers may only create orders in their organisation');
        });

        it ('should place an order', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_CREATE).returns(true);
            (participant as any).orgId = fakeVehicleDetails.makeId;

            participantList.get.withArgs('some orderer').returns('something');

            orderList.count.returns(100);

            stub.getTxID.returns('some tx id');
            stub.getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            generateIdStub.withArgs('some tx id', 'ORDER_100').returns('some id');

            const expectedOrder = new Order(
                'some id', fakeVehicleDetails, OrderStatus.PLACED, fakeOrder, 'some orderer', 1000,
            );

            (await contract.placeOrder(
                ctx as any, 'some orderer', fakeVehicleDetails, fakeOrder,
            )).should.deep.equal(expectedOrder);
            orderList.add.should.have.been.calledOnceWithExactly(expectedOrder);
            ctx.setEvent.should.have.been.calledOnceWithExactly('PLACE_ORDER', expectedOrder);
        });
    });

    describe ('getOrders', () => {
        it ('should error when the caller is not allowed to read orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_READ).returns(false);

            await contract.getOrders(ctx as any).should.be.rejectedWith(
                `Only callers with role ${Roles.ORDER_READ} can read orders`,
            );
        });

        it ('should query with filters for manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_READ).returns(true);

            organization = sinon.createStubInstance(Manufacturer);
            (organization as any).id = 'some org id';
            (clientIdentity as any)._organization = organization;

            const fakeOrder = sinon.createStubInstance(Order);

            orderList.query.withArgs(
                { selector: { vehicleDetails: { makeId: organization.id } } },
            ).returns([fakeOrder]);

            (await contract.getOrders(ctx as any)).should.deep.equal(
                [fakeOrder],
            );
        });

        it ('should query with filters for not manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_READ).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);

            orderList.query.withArgs(
                {},
            ).returns([fakeOrder]);

            (await contract.getOrders(ctx as any)).should.deep.equal(
                [fakeOrder],
            );
        });
    });

    describe ('getOrder', () => {
        it ('should error when the caller is not allowed to read orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_READ).returns(false);

            await contract.getOrder(ctx as any, 'some order id').should.be.rejectedWith(
                `Only callers with role ${Roles.ORDER_READ} can read orders`,
            );
        });

        it ('should error when manufacturer and not made by org', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_READ).returns(true);
            (participant as any).orgId = 'some org';

            organization = sinon.createStubInstance(Manufacturer);
            (clientIdentity as any)._organization = organization;

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true).withArgs('some org').returns(false);

            orderList.get.withArgs('some order id').returns(fakeOrder);

            await contract.getOrder(ctx as any, 'some order id').should.be.rejectedWith(
                `Manufacturers may only read an order made by their organisation`,
            );
        });

        it ('should return when the order is made by their org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_READ).returns(true);
            (participant as any).orgId = 'some org';

            organization = sinon.createStubInstance(Manufacturer);
            (clientIdentity as any)._organization = organization;

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(false).withArgs('some org').returns(true);

            orderList.get.withArgs('some order id').resolves(fakeOrder);

            (await contract.getOrder(ctx as any, 'some order id')).should.deep.equal(
                fakeOrder,
            );
        });

        it ('should return when the caller is not manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_READ).returns(true);
            (participant as any).orgId = 'some org';

            const fakeOrder = sinon.createStubInstance(Order);

            orderList.get.withArgs('some order id').resolves(fakeOrder);

            (await contract.getOrder(ctx as any, 'some order id')).should.deep.equal(
                fakeOrder,
            );
            fakeOrder.madeByOrg.should.have.not.been.called; // tslint:disable-line
        });
    });

    describe ('getOrderHistory', () => {
        it ('should return the history of an order', async () => {
            sandbox.stub(contract, 'getOrder').rejects().withArgs(ctx as any, 'some order id').resolves();
            orderList.getHistory.withArgs('some order id').resolves('some history');

            (await contract.getOrderHistory(ctx as any, 'some order id')).should.deep.equal('some history');
        });
    });

    describe ('scheduleOrderForManufacture', () => {
        it ('should error when the caller is not allowed to update orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_UPDATE).returns(false);

            await contract.scheduleOrderForManufacture(ctx as any, 'some order id').should.be.rejectedWith(
                `Only callers with role ${Roles.ORDER_UPDATE} can schedule orders for manufacture`,
            );
        });

        it ('should error when order was not made by org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(false);

            orderList.get.returns(fakeOrder);

            await contract.scheduleOrderForManufacture(ctx as any, 'some order id').should.be.rejectedWith(
                'Callers may only schedule an order in their organisation for manufacture',
            );
        });

        it ('should update the order', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true);

            const fakeSetter = sinon.stub();

            sandbox.stub(fakeOrder, 'orderStatus').set(fakeSetter);

            orderList.get.returns(fakeOrder);

            (await contract.scheduleOrderForManufacture(ctx as any, 'some order id')).should.deep.equal(
                fakeOrder,
            );

            fakeSetter.should.have.been.calledOnceWithExactly(OrderStatus.SCHEDULED_FOR_MANUFACTURE);
            orderList.update.should.have.been.calledOnceWithExactly(fakeOrder);
            ctx.setEvent.should.have.been.calledOnceWithExactly('UPDATE_ORDER', fakeOrder);
        });
    });

    describe ('registerVehicleForOrder', () => {

        beforeEach(() => {
            (organization as sinon.SinonStubbedInstance<Manufacturer>).originCode = 'some origin code';
            (organization as sinon.SinonStubbedInstance<Manufacturer>).manufacturerCode = 'some manufacturer code';
        });

        it ('should error when the caller is not allowed to update orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_UPDATE).returns(false);

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_CREATE} can register vehicles for orders`, // tslint:disable-line
            );
        });

        it ('should error when the caller is not allowed to create vehicles', async () => {
            participant.hasRole.returns(true).withArgs(Roles.VEHICLE_CREATE).returns(false);

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_CREATE} can register vehicles for orders`, // tslint:disable-line
            );
        });

        it ('should error when manufacturer manufacturer code not set', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
            .withArgs(Roles.VEHICLE_CREATE).returns(true);

            delete (organization as sinon.SinonStubbedInstance<Manufacturer>).originCode;
            delete (organization as sinon.SinonStubbedInstance<Manufacturer>).manufacturerCode;

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                'Manufacturer\'s origin and manufacturer code must be set before vehicles can be registered',
            );
        });

        it ('should error when manufacturer origin code not set', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
            .withArgs(Roles.VEHICLE_CREATE).returns(true);

            delete (organization as sinon.SinonStubbedInstance<Manufacturer>).originCode;

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                'Manufacturer\'s origin and manufacturer code must be set before vehicles can be registered',
            );
        });

        it ('should error when order was not made by org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
                .withArgs(Roles.VEHICLE_CREATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(false);

            orderList.get.returns(fakeOrder);

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                'Callers may only register a vehicle for an order in their organisation',
            );
        });

        it ('should error when vin was not valid', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
                .withArgs(Roles.VEHICLE_CREATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true);

            orderList.get.returns(fakeOrder);

            stub.getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            sandbox.stub(Vehicle, 'validateVin').returns(true)
                .withArgs('some vin', organization as any, 1970).returns(false);

            await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin').should.be.rejectedWith(
                'Invalid VIN supplied',
            );
        });

        it ('should update the order', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
                .withArgs(Roles.VEHICLE_CREATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true);

            stub.getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            sandbox.stub(Vehicle, 'validateVin').returns(false)
                .withArgs('some vin', organization as any, 1970).returns(true);

            const fakeStatusSetter = sinon.stub();
            const fakeVinSetter = sinon.stub();

            sandbox.stub(fakeOrder, 'orderStatus').set(fakeStatusSetter);
            sandbox.stub(fakeOrder, 'vin').set(fakeVinSetter);

            orderList.get.withArgs('some order id').returns(fakeOrder);

            (await contract.registerVehicleForOrder(ctx as any, 'some order id', 'some vin')).should.deep.equal(
                fakeOrder,
            );

            const fakeVehicle = new Vehicle('some vin', fakeOrder.vehicleDetails, VehicleStatus.OFF_THE_ROAD, 1000);

            fakeStatusSetter.should.have.been.calledOnceWithExactly(OrderStatus.VIN_ASSIGNED);
            fakeVinSetter.should.have.been.calledOnceWithExactly('some vin');
            orderList.update.should.have.been.calledOnceWithExactly(fakeOrder);
            vehicleList.add.should.have.been.calledOnceWithExactly(fakeVehicle);
            ctx.setEvent.should.have.been.calledOnceWithExactly('UPDATE_ORDER', fakeOrder);
        });
    });

    describe ('assignOwnershipForOrder', () => {
        it ('should error when the caller is not allowed to update orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_UPDATE).returns(false);

            await contract.assignOwnershipForOrder(ctx as any, 'some order id').should.be.rejectedWith(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_UPDATE} can assign ownership of vehicles of orders`, // tslint:disable-line
            );
        });

        it ('should error when the caller is not allowed to create vehicles', async () => {
            participant.hasRole.returns(true).withArgs(Roles.VEHICLE_UPDATE).returns(false);

            await contract.assignOwnershipForOrder(ctx as any, 'some order id').should.be.rejectedWith(
                `Only callers with roles ${Roles.ORDER_UPDATE} and ${Roles.VEHICLE_UPDATE} can assign ownership of vehicles of orders`, // tslint:disable-line
            );
        });

        it ('should error when order was not made by org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
                .withArgs(Roles.VEHICLE_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(false);

            orderList.get.returns(fakeOrder);

            await contract.assignOwnershipForOrder(ctx as any, 'some order id').should.be.rejectedWith(
                'Callers may only assign an owner for a vehicle of an order in their organisation',
            );
        });

        it ('should update the order', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true)
                .withArgs(Roles.VEHICLE_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true);
            fakeOrder.vin = 'some vin';
            (fakeOrder as any)._ordererId = 'some orderer id';

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            const fakeStatusSetter = sinon.stub();
            const fakeOwnerIdSetter = sinon.stub();

            sandbox.stub(fakeOrder, 'orderStatus').set(fakeStatusSetter);
            sandbox.stub(fakeVehicle, 'ownerId').set(fakeOwnerIdSetter);

            orderList.get.withArgs('some order id').returns(fakeOrder);
            vehicleList.get.withArgs(fakeOrder.vin).returns(fakeVehicle);

            (await contract.assignOwnershipForOrder(ctx as any, 'some order id')).should.deep.equal(
                fakeOrder,
            );

            fakeStatusSetter.should.have.been.calledOnceWithExactly(OrderStatus.OWNER_ASSIGNED);
            fakeOwnerIdSetter.should.have.been.calledOnceWithExactly(fakeOrder.ordererId);
            orderList.update.should.have.been.calledOnceWithExactly(fakeOrder);
            vehicleList.update.should.have.been.calledOnceWithExactly(fakeVehicle);
            ctx.setEvent.should.have.been.calledOnceWithExactly('UPDATE_ORDER', fakeOrder);
        });
    });

    describe ('deliverOrder', () => {
        it ('should error when the caller is not allowed to update orders', async () => {
            participant.hasRole.returns(true).withArgs(Roles.ORDER_UPDATE).returns(false);

            await contract.deliverOrder(ctx as any, 'some order id').should.be.rejectedWith(
                `Only callers with role ${Roles.ORDER_UPDATE} can deliver orders`,
            );
        });

        it ('should error when order was not made by org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(false);

            orderList.get.returns(fakeOrder);

            await contract.deliverOrder(ctx as any, 'some order id').should.be.rejectedWith(
                'Callers may only deliver an order in their organisation',
            );
        });

        it ('should update the order', async () => {
            participant.hasRole.returns(false).withArgs(Roles.ORDER_UPDATE).returns(true);

            const fakeOrder = sinon.createStubInstance(Order);
            fakeOrder.madeByOrg.returns(true);

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            const fakeOrderStatusSetter = sinon.stub();
            const fakeVehicleStatusSetter = sinon.stub();

            sandbox.stub(fakeOrder, 'orderStatus').set(fakeOrderStatusSetter);
            sandbox.stub(fakeVehicle, 'vehicleStatus').set(fakeVehicleStatusSetter);

            orderList.get.returns(fakeOrder);
            vehicleList.get.withArgs(fakeOrder.vin).returns(fakeVehicle);

            (await contract.deliverOrder(ctx as any, 'some order id')).should.deep.equal(
                fakeOrder,
            );

            fakeOrderStatusSetter.should.have.been.calledOnceWithExactly(OrderStatus.DELIVERED);
            fakeVehicleStatusSetter.should.have.been.calledOnceWithExactly(VehicleStatus.ACTIVE);
            orderList.update.should.have.been.calledOnceWithExactly(fakeOrder);
            vehicleList.update.should.have.been.calledOnceWithExactly(fakeVehicle);
            ctx.setEvent.should.have.been.calledOnceWithExactly('UPDATE_ORDER', fakeOrder);
        });
    });

    describe ('getVehicles', () => {
        it ('should error when the caller is not allowed to read vehicles', async () => {
            participant.hasRole.returns(true).withArgs(Roles.VEHICLE_READ).returns(false);

            await contract.getVehicles(ctx as any).should.be.rejectedWith(
                `Only callers with role ${Roles.VEHICLE_READ} can get vehicles`,
            );
        });

        it ('should query with filters for manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.VEHICLE_READ).returns(true);

            organization = sinon.createStubInstance(Manufacturer);
            (clientIdentity as any)._organization = organization;

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            vehicleList.query.withArgs(
                { selector: { vehicleDetails: { makeId: organization.id } } },
            ).returns([fakeVehicle]);

            (await contract.getVehicles(ctx as any)).should.deep.equal(
                [fakeVehicle],
            );
        });

        it ('should query with filters for insurer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.VEHICLE_READ).returns(true);

            organization = sinon.createStubInstance(Insurer);
            (clientIdentity as any)._organization = organization;

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            sandbox.stub(contract, 'getPolicies').withArgs(ctx as any).resolves([{vin: 'vin1'}, {vin: 'vin2'}]);

            vehicleList.query.withArgs(
                { selector: { id: { $in: ['vin1', 'vin2'] } } },
            ).returns([fakeVehicle]);

            (await contract.getVehicles(ctx as any)).should.deep.equal(
                [fakeVehicle],
            );
        });

        it ('should query with filters for not manufacturer or insurer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.VEHICLE_READ).returns(true);

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            vehicleList.query.withArgs(
                {},
            ).returns([fakeVehicle]);

            (await contract.getVehicles(ctx as any)).should.deep.equal(
                [fakeVehicle],
            );
        });
    });

    describe ('getVehicle', () => {
        it ('should error when the caller is not allowed to read vehicles', async () => {
            participant.hasRole.returns(true).withArgs(Roles.VEHICLE_READ).returns(false);

            await contract.getVehicle(ctx as any, 'some vin').should.be.rejectedWith(
                `Only callers with role ${Roles.VEHICLE_READ} can get vehicles`,
            );
        });

        it ('should error when manufacturer and not made by org', async () => {
            participant.hasRole.returns(true).withArgs(Roles.VEHICLE_READ).returns(true);
            (participant as any).orgId = 'some org';

            organization = sinon.createStubInstance(Manufacturer);
            (clientIdentity as any)._organization = organization;

            const fakeVehicle = sinon.createStubInstance(Vehicle);
            fakeVehicle.madeByOrg.returns(true).withArgs('some org').returns(false);

            vehicleList.get.withArgs('some vin').returns(fakeVehicle);

            await contract.getVehicle(ctx as any, 'some vin').should.be.rejectedWith(
                'Manufacturers may only get a vehicle produced by their organisation',
            );
        });

        it ('should return when the order is made by their org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.VEHICLE_READ).returns(true);
            (participant as any).orgId = 'some org';

            organization = sinon.createStubInstance(Manufacturer);
            (clientIdentity as any)._organization = organization;

            const fakeVehicle = sinon.createStubInstance(Vehicle);
            fakeVehicle.madeByOrg.returns(false).withArgs('some org').returns(true);

            vehicleList.get.withArgs('some vin').resolves(fakeVehicle);

            (await contract.getVehicle(ctx as any, 'some vin')).should.deep.equal(
                fakeVehicle,
            );
        });

        it ('should return when the caller is not manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.VEHICLE_READ).returns(true);
            (participant as any).orgId = 'some org';

            const fakeVehicle = sinon.createStubInstance(Vehicle);

            vehicleList.get.withArgs('some vin').resolves(fakeVehicle);

            (await contract.getVehicle(ctx as any, 'some vin')).should.deep.equal(
                fakeVehicle,
            );
            fakeVehicle.madeByOrg.should.have.not.been.called; // tslint:disable-line
        });
    });

    describe ('createPolicy', () => {
        it ('should error when the caller is not allowed to create policies', async () => {
            participant.hasRole.returns(true).withArgs(Roles.POLICY_CREATE).returns(false);

            await contract.createPolicy(
                ctx as any, 'some vin', 'some holder id', PolicyType.FULLY_COMPREHENSIVE, 1,
            ).should.be.rejectedWith(
                `Only callers with role ${Roles.POLICY_CREATE} can create policies`,
            );
        });

        it ('should error when vehicle is not in state to be insured', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_CREATE).returns(true);

            const fakeVehicle = sinon.createStubInstance(Vehicle);
            fakeVehicle.vehicleStatus = VehicleStatus.OFF_THE_ROAD;

            vehicleList.get.withArgs('some vin').returns(fakeVehicle);

            await contract.createPolicy(
                ctx as any, 'some vin', 'some holder id', PolicyType.FULLY_COMPREHENSIVE, 1,
            ).should.be.rejectedWith(
                'Cannot insure vehicle which is not active',
            );
        });

        it ('should create insurance policy', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_CREATE).returns(true);
            (participant as any).orgId = 'some org';

            const fakeVehicle = sinon.createStubInstance(Vehicle);
            fakeVehicle.vehicleStatus = VehicleStatus.ACTIVE;

            vehicleList.get.withArgs('some vin').returns(fakeVehicle);
            policyList.count.returns(100);

            stub.getTxID.returns('some tx id');
            stub.getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            generateIdStub.withArgs('some tx id', 'POLICY_100').returns('some id');

            const expectedPolicy = new Policy(
                'some id', 'some vin', 'some org', 'some holder id', PolicyType.FULLY_COMPREHENSIVE, 1000, 2000,
            );

            (await contract.createPolicy(
                ctx as any, 'some vin', 'some holder id', PolicyType.FULLY_COMPREHENSIVE, 2000,
            )).should.deep.equal(expectedPolicy);

            policyList.add.should.have.been.calledOnceWithExactly(expectedPolicy);
            ctx.setEvent.should.have.been.calledOnceWithExactly('CREATE_POLICY', expectedPolicy);
        });
    });

    describe ('getPolicies', () => {
        it ('should error when the caller is not allowed to read policies', async () => {
            participant.hasRole.returns(true).withArgs(Roles.POLICY_READ).returns(false);

            await contract.getPolicies(ctx as any).should.be.rejectedWith(
                `Only callers with role ${Roles.POLICY_READ} can read policies`,
            );
        });

        it ('should query with filters for insurer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_READ).returns(true);

            organization = sinon.createStubInstance(Insurer);
            (organization as any).id = 'some org id';
            (clientIdentity as any)._organization = organization;

            const fakePolicy = sinon.createStubInstance(Policy);

            policyList.query.withArgs(
                { selector: { insurerId: organization.id } },
            ).returns([fakePolicy]);

            (await contract.getPolicies(ctx as any)).should.deep.equal(
                [fakePolicy],
            );
        });

        it ('should query with filters for not insurer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_READ).returns(true);

            const fakePolicy = sinon.createStubInstance(Policy);

            policyList.query.withArgs(
                {},
            ).returns([fakePolicy]);

            (await contract.getPolicies(ctx as any)).should.deep.equal(
                [fakePolicy],
            );
        });
    });

    describe ('getPolicy', () => {
        it ('should error when the caller is not allowed to read policies', async () => {
            participant.hasRole.returns(true).withArgs(Roles.POLICY_READ).returns(false);

            await contract.getPolicy(ctx as any, 'some policy id').should.be.rejectedWith(
                `Only callers with role ${Roles.POLICY_READ} can read policies`,
            );
        });

        it ('should error when insurer and not their policy', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_READ).returns(true);

            organization = sinon.createStubInstance(Insurer);
            (organization as any).id = 'some org';
            (clientIdentity as any)._organization = organization;

            const fakePolicy = sinon.createStubInstance(Policy);
            (fakePolicy as any).insurerId = 'some other org';

            policyList.get.withArgs('some policy id').returns(fakePolicy);

            await contract.getPolicy(ctx as any, 'some policy id').should.be.rejectedWith(
                'Only insurers who insure the policy can view it',
            );
        });

        it ('should return when the policy is owned by their org', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_READ).returns(true);

            organization = sinon.createStubInstance(Insurer);
            (organization as any).id = 'some org';
            (clientIdentity as any)._organization = organization;

            const fakePolicy = sinon.createStubInstance(Policy);
            (fakePolicy as any).insurerId = 'some org';

            policyList.get.withArgs('some policy id').resolves(fakePolicy);

            (await contract.getPolicy(ctx as any, 'some policy id')).should.deep.equal(
                fakePolicy,
            );
        });

        it ('should return when the caller is not manufacturer', async () => {
            participant.hasRole.returns(false).withArgs(Roles.POLICY_READ).returns(true);

            const fakePolicy = sinon.createStubInstance(Policy);

            policyList.get.withArgs('some policy id').resolves(fakePolicy);

            (await contract.getPolicy(ctx as any, 'some policy id')).should.deep.equal(
                fakePolicy,
            );
        });
    });

    describe ('addUsageEvent', async () => {
        it ('should error when the caller is not allowed to create usage event', async () => {
            participant.hasRole.returns(true).withArgs(Roles.USAGE_EVENT_CREATE).returns(false);

            await contract.addUsageEvent(
                ctx as any, 'some vin', EventType.CRASHED, 1, 20, 50, 100, 1, 1,
            ).should.be.rejectedWith(
                `Only callers with role ${Roles.USAGE_EVENT_CREATE} can add usage events`,
            );
        });

        it ('should add a usage event', async () => {
            participant.hasRole.returns(false).withArgs(Roles.USAGE_EVENT_CREATE).returns(true);

            sinon.stub(contract, 'getVehicle').rejects('stub called with bad args')
                .withArgs(ctx as any, 'some vin').resolves();

            stub.getTxID.returns('some tx id');
            stub.getTxTimestamp.returns({
                getSeconds: () => {
                    return {
                        toInt: () => {
                            return 1;
                        },
                    };
                },
            });

            generateIdStub.withArgs('some tx id', EventType.CRASHED.toString()).returns('some id');

            const expectedUsageEvent = new UsageEvent(
                'some id', EventType.CRASHED, 1, 20, 50, 100, 1, 1, 1000, 'some vin',
            );

            (await contract.addUsageEvent(
                ctx as any, 'some vin', EventType.CRASHED, 1, 20, 50, 100, 1, 1,
            )).should.deep.equal(expectedUsageEvent);

            usageList.add.should.have.been.calledOnceWithExactly(expectedUsageEvent);
            ctx.setEvent.should.have.been.calledOnceWithExactly('ADD_USAGE_EVENT', expectedUsageEvent);
        });
    });

    describe ('getUsageEvents', async () => {
        it ('should error when the caller is not allowed to read usage events', async () => {
            participant.hasRole.returns(true).withArgs(Roles.USAGE_EVENT_READ).returns(false);

            await contract.getUsageEvents(
                ctx as any,
            ).should.be.rejectedWith(
                `Only callers with role ${Roles.USAGE_EVENT_READ} can get usage events`,
            );
        });

        it ('should return all usage events', async () => {
            participant.hasRole.returns(false).withArgs(Roles.USAGE_EVENT_READ).returns(true);

            sandbox.stub(contract, 'getVehicles')
                .withArgs(ctx as any).resolves([{id: 'vin 1'}, {id: 'vin 2'}]);

            sandbox.stub(contract, 'getVehicleEvents')
                .withArgs(ctx as any, 'vin 1').resolves(['EVENT VIN 1 1', 'EVENT VIN 1 2'])
                .withArgs(ctx as any, 'vin 2').resolves(['EVENT VIN 2 1', 'EVENT VIN 2 2']);

            (await contract.getUsageEvents(ctx as any)).should.deep.equal(
                ['EVENT VIN 1 1', 'EVENT VIN 1 2', 'EVENT VIN 2 1', 'EVENT VIN 2 2'],
            );
        });
    });

    describe ('getUsageEvents', async () => {
        it ('should error when get vehicle errors', async () => {
            sandbox.stub(contract, 'getVehicle').resolves()
                .withArgs(ctx as any, 'some vin').rejects(Error('some error'));

            await contract.getVehicleEvents(
                ctx as any, 'some vin',
            ).should.be.rejectedWith(
                `some error`,
            );
        });

        it ('should error when the caller is not allowed to read usage events', async () => {
            sandbox.stub(contract, 'getVehicle').resolves();

            participant.hasRole.returns(true).withArgs(Roles.USAGE_EVENT_READ).returns(false);

            await contract.getVehicleEvents(
                ctx as any, 'some vin',
            ).should.be.rejectedWith(
                `Only callers with role ${Roles.USAGE_EVENT_READ} can get usage events`,
            );
        });

        it ('should return the usage events of a vehicle', async () => {
            sandbox.stub(contract, 'getVehicle').resolves();

            participant.hasRole.returns(false).withArgs(Roles.USAGE_EVENT_READ).returns(true);

            usageList.query.withArgs({selector: {vin: 'some vin'}}).resolves(['some', 'usage', 'events']);

            (await contract.getVehicleEvents(ctx as any, 'some vin')).should.deep.equal(['some', 'usage', 'events']);
        });
    });

    describe ('getPolicyEvents', async () => {
        const fakePolicy = {
            endDate: 2000,
            startDate: 1000,
            vin: 'some vin',
        };

        it ('should error when get policy errors', async () => {
            sandbox.stub(contract, 'getPolicy').resolves()
                .withArgs(ctx as any, 'some policy id').rejects(Error('some error'));

            await contract.getPolicyEvents(
                ctx as any, 'some policy id',
            ).should.be.rejectedWith(
                `some error`,
            );
        });

        it ('should error when get policy errors', async () => {
            sandbox.stub(contract, 'getPolicy').rejects()
                .withArgs(ctx as any, 'some policy id').resolves(fakePolicy);
            sandbox.stub(contract, 'getVehicle').resolves()
                .withArgs(ctx as any, fakePolicy.vin).rejects(Error('some error'));

            await contract.getPolicyEvents(
                ctx as any, 'some policy id',
            ).should.be.rejectedWith(
                `some error`,
            );
        });

        it ('should error when the caller is not allowed to read usage events', async () => {
            sandbox.stub(contract, 'getPolicy').rejects()
                .withArgs(ctx as any, 'some policy id').resolves(fakePolicy);
            sandbox.stub(contract, 'getVehicle').resolves();

            participant.hasRole.returns(true).withArgs(Roles.USAGE_EVENT_READ).returns(false);

            await contract.getPolicyEvents(
                ctx as any, 'some policy id',
            ).should.be.rejectedWith(
                `Only callers with role ${Roles.USAGE_EVENT_READ} can get usage events`,
            );
        });

        it ('should return the usage events of a vehicle', async () => {
            sandbox.stub(contract, 'getPolicy').rejects()
                .withArgs(ctx as any, 'some policy id').resolves(fakePolicy);
            sandbox.stub(contract, 'getVehicle').resolves();

            participant.hasRole.returns(false).withArgs(Roles.USAGE_EVENT_READ).returns(true);

            usageList.query.withArgs({
                selector: {vin: fakePolicy.vin, timestamp: {$gte: fakePolicy.startDate, $lt: fakePolicy.endDate }},
            }).resolves(['some', 'usage', 'events']);

            (await contract.getPolicyEvents(ctx as any, 'some policy id'))
                .should.deep.equal(['some', 'usage', 'events']);

        });
    });
});

function requireVehicleContract() {
    return require('./vehicle.ts').VehicleContract;
}

function cleanCache() {
    delete require.cache[require.resolve('./vehicle.ts')];
}
