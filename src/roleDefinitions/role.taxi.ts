import { RoleCreep } from "./base/role.creep";
import _ from "lodash";
import { TaxiServiceManager } from "managers/manager.taxiService";

export class RoleTaxi extends RoleCreep {
    public run(creep: Creep) {
        if (creep.memory.taxi) {
            const client = Game.creeps[creep.memory.taxi.client];
            if (client.spawning) {
                if (!creep.pos.isNearTo(client)) {
                    creep.moveTo(client.pos);
                }
                return;
            }
            if (creep.memory.taxi.taxiRoute) {
                this.drive(creep, client);
            } else {
                this.pickupClient(creep, client);
            }
        } else {
            console.log(`Creep: ${creep.name} has been orphaned as a taxi driver.`);
        }
    }

    private drive(taxi: Creep, client: Creep) {
        taxi.say("🚕");
        client.say("💤");
        if (!taxi.fatigue) {
            if (taxi.memory.taxi!.taxiRoute && taxi.memory.taxi!.taxiRoute.length > 0) {
                const lastPos = _.first(taxi.memory.taxi!.taxiRoute);
                if (lastPos!.x === taxi.pos.x && lastPos!.y === taxi.pos.y) {
                    taxi.memory.taxi!.taxiRoute = _.tail(taxi.memory.taxi!.taxiRoute);
                }
                if (taxi.memory.taxi!.taxiRoute.length === 0) {
                    this.terminateTaxi(taxi, client);
                } else {
                    const currentDestination = _.first(taxi.memory.taxi!.taxiRoute);
                    if (currentDestination) {
                        this.relocatePedestrian(
                            taxi,
                            new RoomPosition(currentDestination.x, currentDestination.y, taxi.room.name),
                            client.pos
                        );
                        this.pullMove(taxi, client);
                    }
                }
            } else {
                console.log(`Taxi code FAILURE. Fix this`);
            }
        }
    }

    private relocatePedestrian(taxi: Creep, pos: RoomPosition, relocationPos: RoomPosition): boolean {
        const blockers = pos.lookFor(LOOK_CREEPS);
        if (blockers.length > 0) {
            const blocker = _.first(blockers);
            if (blocker) {
                if (blocker.fatigue) {
                    taxi.say("🚨");
                    return false;
                } else if (!blocker.my) {
                    // TODO Handle enemies
                } else {
                    this.movePedestrian(blocker, relocationPos);
                }
            }
        } else {
            return true;
        }
        return false;
    }

    // TODO fix slight edge case around pedestrian already having moved.
    private movePedestrian(ped: Creep, relocationPos: RoomPosition): boolean {
        ped.moveTo(relocationPos, { ignoreCreeps: false });
        ped.memory.moved = true;
        return false;
    }

    private pickupClient(taxi: Creep, client: Creep) {
        // TODO use move calculations to determine optimal meeting position.
        if (taxi.pos.isNearTo(client)) {
            taxi.memory.taxi!.taxiRoute = taxi.pos.findPathTo(
                taxi.memory.taxi!.destination.x,
                taxi.memory.taxi!.destination.y,
                { ignoreCreeps: true }
            );
            this.pullMove(taxi, client);
            taxi.say("Get In");
        } else {
            client.memory.activeTaxi = true;
            taxi.moveTo(client);
        }
    }

    private pullMove(taxi: Creep, client: Creep) {
        taxi.pull(client);
        taxi.move(_.first(taxi.memory.taxi!.taxiRoute)!.direction);
        client.move(taxi);
    }

    private terminateTaxi(taxi: Creep, client: Creep) {
        taxi.pull(client);
        taxi.move(taxi.pos.getDirectionTo(client));
        client.move(taxi);
        taxi.say("💳");
        client.say("💳");
        taxi.memory.role = taxi.memory.taxi!.originalRole;
        delete client.memory.activeTaxi;
    }
}
