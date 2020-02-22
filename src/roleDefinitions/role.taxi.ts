import _ from "lodash";
import { CreepRole } from "enums/enum.roles";
import { RoleHauler } from "./role.hauler";

export class RoleTaxi extends RoleHauler {
    public run(creep: Creep) {
        if (creep.memory.taxi) {
            const client = Game.creeps[creep.memory.taxi.client];
            if (client) {
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
            }
        } else {
            super.run(creep);
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
                    taxi.memory.stuckCount = 0;
                } else {
                    if (!taxi.memory.stuckCount) {
                        taxi.memory.stuckCount = 1;
                    } else {
                        taxi.memory.stuckCount++;
                    }
                    if (taxi.memory.taxi!.arrivalDistance) {
                        if (taxi.pos.inRangeTo(taxi.memory.taxi!.destination, taxi.memory.taxi!.arrivalDistance)) {
                            this.concludeTaxi(taxi, client);
                            return;
                        }
                    }
                    if (taxi.memory.stuckCount > 2) {
                        taxi.memory.taxi!.taxiRoute = taxi.pos.findPathTo(taxi.memory.taxi!.destination, {
                            ignoreCreeps: false,
                            range: taxi.memory.taxi!.arrivalDistance ?? 0
                        });
                        this.pullMove(taxi, client);
                        taxi.memory.stuckCount = 0;
                        return;
                    }
                }
                if (taxi.memory.taxi!.taxiRoute.length === 0) {
                    this.concludeTaxi(taxi, client);
                    return;
                } else {
                    const currentDestination = _.first(taxi.memory.taxi!.taxiRoute);
                    if (currentDestination) {
                        this.relocatePedestrian(
                            taxi,
                            new RoomPosition(currentDestination.x, currentDestination.y, taxi.room.name),
                            client
                        );
                        this.pullMove(taxi, client);
                    }
                }
            } else {
                this.concludeTaxi(taxi, client);
            }
        }
    }

    private relocatePedestrian(taxi: Creep, pos: RoomPosition, client: Creep): boolean {
        const blockers = pos.lookFor(LOOK_CREEPS);
        if (blockers.length > 0) {
            const blocker = _.first(blockers);
            if (blocker && blocker.name !== taxi.memory.taxi!.client) {
                if (blocker.fatigue) {
                    taxi.say("🚨");
                    return false;
                } else if (!blocker.my) {
                    // TODO Handle enemies better
                    this.taxiOvertake(taxi, client);
                } else {
                    if (!this.movePedestrian(blocker, client.pos)) {
                        this.taxiOvertake(taxi, client);
                    }
                }
            }
        }
        return false;
    }

    private movePedestrian(ped: Creep, relocationPos: RoomPosition): boolean {
        if ((ped.memory.role !== CreepRole.taxi || !ped.memory.taxi) && ped.getActiveBodyparts(MOVE)) {
            ped.moveTo(relocationPos, { ignoreCreeps: false });
            ped.memory.moved = true;
            return true;
        }
        return false;
    }

    private taxiOvertake(taxi: Creep, client: Creep): boolean {
        if (taxi.memory.taxi!.taxiRoute && taxi.memory.taxi!.taxiRoute.length >= 2) {
            const routeToPathStep = taxi.memory.taxi!.taxiRoute[1];
            if (routeToPathStep) {
                const routeToPos = new RoomPosition(routeToPathStep.x, routeToPathStep.y, taxi.room.name);
                const bypassPath = taxi.pos.findPathTo(routeToPos, { ignoreCreeps: false });
                if (bypassPath) {
                    taxi.memory.taxi!.taxiRoute = _.concat(bypassPath, _.drop(taxi.memory.taxi!.taxiRoute, 2));
                    taxi.memory.stuckCount = 0;
                    return true;
                }
            }
        }
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
        if (taxi.memory.taxi && taxi.memory.taxi.taxiRoute && taxi.memory.taxi.taxiRoute.length > 0) {
            taxi.pull(client);
            taxi.move(_.first(taxi.memory.taxi.taxiRoute)!.direction);
            client.move(taxi);
        }
    }

    private concludeTaxi(taxi: Creep, client: Creep) {
        taxi.pull(client);
        taxi.move(taxi.pos.getDirectionTo(client));
        client.move(taxi);
        taxi.say("💳");
        client.say("💳");
        taxi.memory.role = taxi.memory.taxi!.originalRole;
        client.memory.moved = true;
        delete taxi.memory.taxi;
        delete client.memory.activeTaxi;
    }
}
