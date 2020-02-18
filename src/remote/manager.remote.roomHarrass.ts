import _ from "lodash";
import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "spawning/manager.dedicatedCreepRequester";
import { BodyBuilder } from "spawning/spawning.bodyBuilder";
import { RemoteShared } from "./remote.shared";
import { SpawnPlanting } from "building/building.spawnPlanting";

export class RoomHarassManager {
    spawn!: StructureSpawn;
    harass!: RoomHarrass;

    constructor(spawn: StructureSpawn, harass: RoomHarrass) {
        this.spawn = spawn;
        this.harass = harass;
    }

    public manageHarass() {
        const room = Game.rooms[this.harass.roomName];
        if (room) {
            if (room.controller!.my) {
                const spawnPlant: SpawnPlanting = new SpawnPlanting(room, this.spawn);
                if (spawnPlant.plant()) {
                    _.remove(this.spawn.memory.roomHarass!, rh => {
                        return rh.roomName === this.harass.roomName;
                    });
                }
                return;
            }
        }
        if (this.spawn.spawning) {
            return;
        }
        if (this.harass.knights === null) {
            this.harass.knights = [];
        }
        if (this.harass.archers === null) {
            this.harass.archers = [];
        }

        if (this.roomSafeMode()) {
            return;
        }
        this.maintainHarrassment();
        if (this.harass.reassign) {
            this.handleReassignment();
        }
        this.manageDgStrength();
    }

    private handleReassignment() {
        for (const name of _.compact(_.concat(this.harass.archers, this.harass.knights, [this.harass.downgrader]))) {
            const creep = Game.creeps[name];
            if (creep) {
                creep.memory.working = false;
                creep.memory.orders = { target: this.harass.roomName, independentOperator: false };
            }
        }
        this.harass.reassign = false;
    }

    private maintainHarrassment() {
        if (this.spawn.spawning) {
            return;
        }
        this.harassPreSpawn();
        if (this.harass.knights) {
            this.removeUnusedknights();
            if (this.harass.knights.length < this.harass.knightCap) {
                this.requestKnight();
            }
        }
        if (this.harass.archers) {
            this.removeUnusedArchers();
            if (this.harass.archers.length < this.harass.archerCap) {
                this.requestArcher();
            }
        }
        if (this.harass.dgStrength > 0) {
            if (this.harass.downgrader) {
                const dg = Game.creeps[this.harass.downgrader];
                if (!dg) {
                    this.requestDowngrader(this.harass.dgStrength);
                }
            } else {
                this.requestDowngrader(this.harass.dgStrength);
            }
        }
    }

    private harassPreSpawn(): boolean {
        for (const name of _.compact(_.concat(this.harass.archers, this.harass.knights, [this.harass.downgrader]))) {
            const creep = Game.creeps[name];
            if (creep) {
                if (creep.hits > 0 && creep.ticksToLive && creep.ticksToLive < this.harass.distance + 50) {
                    switch (creep.memory.role) {
                        case CreepRole.knight: {
                            _.remove(this.harass.knights!, h => {
                                return h === name;
                            });
                            break;
                        }
                        case CreepRole.archer: {
                            _.remove(this.harass.archers!, h => {
                                return h === name;
                            });
                            break;
                        }
                        case CreepRole.knight: {
                            this.harass.downgrader = null;
                            break;
                        }
                    }
                }
            }
        }
        return false;
    }

    private removeUnusedknights() {
        for (const knight of this.harass.knights!) {
            if (!Game.creeps[knight]) {
                if (_.filter(this.spawn.memory.dedicatedCreepRequest, cr => cr.specifiedName === knight).length === 0) {
                    _.remove(this.harass.knights!, h => {
                        return h === knight;
                    });
                }
            }
        }
    }

    private removeUnusedArchers() {
        for (const archer of this.harass.archers!) {
            if (!Game.creeps[archer]) {
                if (_.filter(this.spawn.memory.dedicatedCreepRequest, cr => cr.specifiedName === archer).length === 0) {
                    _.remove(this.harass.archers!, h => {
                        return h === archer;
                    });
                }
            }
        }
    }

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.orders && dc.orders.target === this.harass.roomName && dc.role === role;
        });
    }

    private requestKnight() {
        let body = null;
        if (this.harass.kStrength + this.harass.kHeal > 0) {
            body = BodyBuilder.FillDualType(ATTACK, this.harass.kStrength, HEAL, this.harass.kHeal, true);
        }
        if (!this.creepInQueue(CreepRole.knight)) {
            const knightName: string = `knight${this.harass.roomName}${Memory.creepTicker}`;
            Memory.creepTicker++;
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: CreepOrder = {
                target: this.harass.roomName,
                independentOperator: false
            };
            dcr.createdDedicatedCreepRequest({
                dedication: "",
                role: CreepRole.knight,
                specifiedName: knightName,
                precious: undefined,
                isRemote: true,
                orders: orders,
                body: body ?? undefined
            });
            if (this.harass.knights!.length > 0) {
                this.harass.knights?.push(knightName);
            } else {
                this.harass.knights = [knightName];
            }
        }
    }

    private requestArcher() {
        let body = null;
        if (this.harass.aStrength + this.harass.aHeal > 0) {
            body = BodyBuilder.FillDualType(RANGED_ATTACK, this.harass.aStrength, HEAL, this.harass.aHeal);
        }
        if (!this.creepInQueue(CreepRole.archer)) {
            const archerName: string = `archer${this.harass.roomName}${Memory.creepTicker}`;
            Memory.creepTicker++;
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: CreepOrder = {
                target: this.harass.roomName,
                independentOperator: false
            };
            dcr.createdDedicatedCreepRequest({
                dedication: "",
                role: CreepRole.archer,
                specifiedName: archerName,
                precious: undefined,
                isRemote: true,
                orders: orders,
                body: body ?? undefined
            });
            if (this.harass.archers!.length > 0) {
                this.harass.archers?.push(archerName);
            } else {
                this.harass.archers = [archerName];
            }
        }
    }

    private requestDowngrader(size: number) {
        if (!this.creepInQueue(CreepRole.reserver)) {
            const claimer: string = `claimer${this.harass.roomName}${Memory.creepTicker}`;
            Memory.creepTicker++;
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: ReserverOrder = {
                target: this.harass.roomName,
                independentOperator: false,
                reserving: false,
                claiming: this.harass.dgClaim!,
                downgrading: !this.harass.dgClaim
            };
            dcr.createdDedicatedCreepRequest({
                dedication: this.harass.roomName,
                role: CreepRole.reserver,
                specifiedName: claimer,
                precious: undefined,
                isRemote: true,
                orders: orders,
                body: BodyBuilder.FillMonotype(CLAIM, size)
            });
            this.harass.downgrader = claimer;
        }
    }

    private roomSafeMode(): boolean {
        if (!this.harass.pauseToTime) {
            this.harass.pauseToTime = 0;
        }
        if (this.harass.pauseToTime - Game.time < 600) {
            return false;
        } else {
            return true;
        }
    }

    private manageDgStrength() {
        const room = Game.rooms[this.harass.roomName];
        if (room) {
            // Check if the room is clear.
            if (room.find(FIND_HOSTILE_CREEPS).length === 0 && room.find(FIND_HOSTILE_STRUCTURES).length === 0) {
                // Check if the controller needs DG or Claim
                if (Memory.readyForExpansion && !room.controller!.my && room.controller!.level === 0) {
                    this.harass.dgClaim = true;
                } else {
                    this.harass.dgClaim = false;
                }
                if (Memory.readyForExpansion) {
                    if (this.spawn.room.energyCapacityAvailable >= 1300 && !this.harass.dgClaim) {
                        this.harass.dgStrength = 2;
                    } else if (this.spawn.room.energyCapacityAvailable >= 650) {
                        this.harass.dgStrength = 1;
                    } else {
                        this.harass.dgStrength = 0;
                    }
                }
            }
        }
    }
}
