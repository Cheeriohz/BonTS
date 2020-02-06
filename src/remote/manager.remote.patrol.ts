import _ from "lodash";
import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "cycle/manager.dedicatedCreepRequester";

export class RemotePatrolManager {
    spawn!: StructureSpawn;
    patrol!: RemotePatrol;

    constructor(spawn: StructureSpawn, patrol: RemotePatrol) {
        this.spawn = spawn;
        this.patrol = patrol;
    }

    public managePatrol() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.patrol.knights === null) {
            this.patrol.knights = [];
        }
        this.maintainKnights();
        this.checkForRoute();
    }

    private checkForRoute() {
        for (const roomName of this.patrol.checkRooms) {
            const room = Game.rooms[roomName];
            if (room) {
                if (room.find(FIND_HOSTILE_CREEPS).length > 0) {
                    this.routeKnights(roomName);
                    return;
                }
            }
        }
    }

    private routeKnights(roomName: string) {
        for (const knightName of this.patrol.knights!) {
            const knight = Game.creeps[knightName];
            if (
                knight &&
                knight.memory.working === false &&
                knight.memory.orders &&
                knight.memory.orders.independentOperator === true
            ) {
                knight.memory.working = true;
                knight.memory.orders.independentOperator = false;
                knight.memory.orders.target = roomName;
            }
        }
    }

    private maintainKnights() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.patrol.knights) {
            if (this.patrolPreSpawn()) {
                this.requestKnight();
                return;
            }
            this.removeUnusedknights();
            if (this.patrol.knights.length < this.patrol.count) {
                this.requestKnight();
            }
        } else {
            this.patrol.knights = [];
            this.requestKnight();
        }
    }

    private patrolPreSpawn(): boolean {
        return false;
    }

    private removeUnusedknights() {
        for (const knight of this.patrol.knights!) {
            if (!Game.creeps[knight]) {
                _.remove(this.patrol.knights!, h => {
                    return h === knight;
                });
            }
        }
    }

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.orders && dc.orders.target === this.patrol.roomName && dc.role === role;
        });
    }

    private requestKnight() {
        if (!this.creepInQueue(CreepRole.knight)) {
            const knightName: string = `patrol${Game.time.toPrecision(8)}`;
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: CreepOrder = {
                target: this.patrol.roomName,
                independentOperator: true
            };
            dcr.createdDedicatedCreepRequest({
                dedication: "Chivalry",
                role: CreepRole.knight,
                specifiedName: knightName,
                precious: undefined,
                isRemote: false,
                orders: orders
            });
            if (this.patrol.knights!.length > 0) {
                this.patrol.knights?.push(knightName);
            } else {
                this.patrol.knights = [knightName];
            }
        }
    }
}
