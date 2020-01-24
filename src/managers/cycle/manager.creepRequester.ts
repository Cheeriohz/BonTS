import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

export class CreepRequester {
    private spawn!: StructureSpawn;
    private rampartMaxRepairThreshold: number = 1000000;
    private builderSpawnThreshold: number = 100000;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public CheckForRepairNeed(): void {
        if (!this.RepairCreepRequested() && !this.HaveRepairWorker() && this.HaveDamagedRamparts()) {
            const builderRequest: CreepRequest = { role: CreepRole.builder, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] };
            if (!this.spawn.memory.remoteCreepRequest) {
                this.spawn.memory.remoteCreepRequest = [];
            }
            this.spawn.memory.remoteCreepRequest.push(builderRequest);
        }
    }

    private RepairCreepRequested(): boolean {
        // TODO: Switch to different types or queues.
        const creepRequest = _.filter(this.spawn.memory.remoteCreepRequest, (cr) => { return (cr.role === CreepRole.builder); });
        if (creepRequest) {
            if (creepRequest.length > 0) {
                return true;
            }
        }
        return false;
    }

    private HaveRepairWorker(): boolean {
        // first see if we already have a dedicated repairer.
        const roomData = Memory.roleRoomMap[this.spawn.room.name];
        if (roomData) {
            // TODO: Encorporate dedicated repairer
            if (roomData[CreepRole.builder] > 0) {
                return true;
            }
        }
        return false;
    }

    private HaveDamagedRamparts(): boolean {
        const ramparts = this.spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_RAMPART && this.rampartMaxRepairThreshold - structure.hits > 100000);
            }
        });

        if (ramparts) {
            if (ramparts.length > 0) {
                let totalDamage: number = 0;
                _.forEach(ramparts, (r) => totalDamage += this.rampartMaxRepairThreshold - r.hits);
                if (totalDamage > this.builderSpawnThreshold) {
                    return true;
                }
            }
        }
        return false;
    }




}
