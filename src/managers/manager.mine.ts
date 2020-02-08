import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../spawning/manager.dedicatedCreepRequester";
import _ from "lodash";
import { CreepRequester } from "../spawning/manager.creepRequester";

export class MineManager {
    room!: Room;
    spawn!: StructureSpawn;

    constructor(room: Room, spawn: StructureSpawn) {
        this.room = room;
        this.spawn = spawn;
    }

    public manageMine(checkPersonnel: boolean) {
        if (this.room.memory.mine) {
            if (checkPersonnel) {
                this.checkPersonnel();
            }
        }
    }

    private checkPersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.room.memory.mine) {
            if (this.room.memory.mine.miner !== "") {
                const miner = Game.creeps[this.room.memory.mine.miner];
                if (!miner) {
                    if (!this.creepNotInQueue(this.room.memory.mine.miner)) {
                        const container: StructureContainer | null = Game.getObjectById(
                            this.room.memory.mine!.containerId
                        );
                        if (container) {
                            if (this.minerNeeded()) {
                                this.requestMiner(this.room.memory.mine);
                            }
                        } else {
                            if (!this.reassignContainer()) {
                                this.rebuildContainer();
                            }
                            return;
                        }
                    }
                }
            } else {
                this.requestMiner(this.room.memory.mine);
            }
            if (this.room.memory.mine.hauler !== "") {
                const hauler = Game.creeps[this.room.memory.mine.hauler];
                if (!hauler) {
                    if (!this.creepNotInQueue(this.room.memory.mine.hauler)) {
                        if (this.haulerNeeded()) {
                            this.requestHauler(this.room.memory.mine);
                        }
                    }
                }
            } else {
                this.requestHauler(this.room.memory.mine);
            }
        }
    }

    private minerNeeded(): boolean {
        if (this.room.memory.mine) {
            const vein: Mineral | Deposit | null = Game.getObjectById<Mineral | Deposit>(this.room.memory.mine.vein);
            const mineralAmount = _.get(vein, "mineralAmount", null);
            if (mineralAmount) {
                // TODO Make this more robust
                if (mineralAmount > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    private haulerNeeded(): boolean {
        const container: StructureContainer | null = Game.getObjectById(this.room.memory.mine!.containerId);
        if (container) {
            if (container.store.getFreeCapacity() < 400) {
                return true;
            }
        } else {
            // Container has been destroyed, need to rebuild
            if (!this.reassignContainer()) {
                this.rebuildContainer();
            }
        }
        return false;
    }

    private reassignContainer(): boolean {
        const vein: Mineral | Deposit | null = Game.getObjectById(this.room.memory.mine!.vein);
        if (vein) {
            const newContainers: StructureContainer[] | null = vein.pos.findInRange<StructureContainer>(
                FIND_STRUCTURES,
                1,
                {
                    filter: s => {
                        return s.structureType === STRUCTURE_CONTAINER;
                    }
                }
            );
            if (newContainers.length > 0) {
                this.room.memory.mine!.containerId = newContainers[0].id;
                return true;
            }
        }
        return false;
    }

    private rebuildContainer() {
        const vein: Mineral | Deposit | null = Game.getObjectById(this.room.memory.mine!.vein);
        if (vein) {
            const nearestRoad: Structure | null = vein.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s => {
                    return s.structureType === STRUCTURE_ROAD;
                }
            });
            if (nearestRoad) {
                this.room.createConstructionSite(nearestRoad.pos.x, nearestRoad.pos.y, STRUCTURE_CONTAINER);
                const cr: CreepRequester = new CreepRequester(this.spawn);
                cr.MaintainBuilder();
            }
        }
    }

    private creepNotInQueue(creepName: string) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.specifiedName === creepName;
        });
    }

    private requestMiner(mine: Mine) {
        const minerName: string = `dMiner${this.room.name}${Game.time}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: mine.containerId,
            role: CreepRole.dropper,
            specifiedName: minerName
        });
        mine.miner = minerName;
    }

    private requestHauler(mine: Mine) {
        const haulerName: string = `dHauler${this.room.name}${Game.time}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: mine.containerId,
            role: CreepRole.hauler,
            specifiedName: haulerName
        });
        mine.hauler = haulerName;
    }
}
