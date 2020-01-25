import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "./cycle/manager.dedicatedCreepRequester";
import _ from "lodash";

export class MineManager {
    room!: Room;
    spawn!: StructureSpawn


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
                        this.requestMiner(this.room.memory.mine);
                    }
                }
            }
            else {
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
            }
            else {
                this.requestHauler(this.room.memory.mine);
            }
        }


    }

    private haulerNeeded(): boolean {
        const container: StructureContainer | null = Game.getObjectById(this.room.memory.mine!.containerId);
        if (container!.store.getFreeCapacity() < 400) {
            return true;
        }
        else {
            return false;
        }
    }

    private creepNotInQueue(creepName: string) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, (dc) => { return dc.specifiedName === creepName; });
    }

    private requestMiner(mine: Mine) {
        const minerName: string = `dMiner${this.room.name}${Game.time}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest(mine.containerId, CreepRole.dropper, minerName);
        mine.miner = minerName;
    }

    private requestHauler(mine: Mine) {
        const haulerName: string = `dHauler${this.room.name}${Game.time}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest(mine.containerId, CreepRole.hauler, haulerName);
        mine.hauler = haulerName;
    }

}
