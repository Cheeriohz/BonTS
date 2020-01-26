import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

export class CreepRequester {
    private spawn!: StructureSpawn;
    private rampartMaxRepairThreshold: number = 1000000;
    private builderSpawnThreshold: number = 100000;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public MaintainBuilder(): void {
        if (!this.RepairCreepRequested() && !this.HaveRepairWorker()) {
            this.RequestRepairBot();
        }
    }


    public CheckForRepairNeed(): void {
        if (!this.RepairCreepRequested() && !this.HaveRepairWorker() && (this.HaveDamagedRamparts() || this.HaveDamagedContainers())) {
            this.RequestRepairBot();
        }
    }

    private RequestRepairBot() {
        const builderRequest: CreepRequest = { role: CreepRole.builder, body: [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE] };
        if (!this.spawn.memory.remoteCreepRequest) {
            this.spawn.memory.remoteCreepRequest = [];
        }
        this.spawn.memory.remoteCreepRequest.push(builderRequest);
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

    private HaveDamagedContainers(): boolean {
        return this.HaveDamagedStructure(STRUCTURE_CONTAINER, StructureContainer.prototype.hitsMax, (StructureContainer.prototype.hitsMax / 5), (2 * (StructureContainer.prototype.hitsMax / 5)));
    }

    private HaveDamagedRamparts(): boolean {
        return this.HaveDamagedStructure(STRUCTURE_RAMPART, this.rampartMaxRepairThreshold, 100000, this.builderSpawnThreshold)
    }

    private HaveDamagedStructure(structureType: StructureConstant, individualThreshold: number, individualDifference: number, totalThreshold: number): boolean {
        const structures = this.spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === structureType && individualThreshold - structure.hits > individualDifference);
            }
        });

        if (structures) {
            if (structures.length > 0) {
                let totalDamage: number = 0;
                _.forEach(structures, (s) => totalDamage += individualThreshold - s.hits);
                if (totalDamage > totalThreshold) {
                    return true;
                }
            }
        }
        return false;
    }
}
