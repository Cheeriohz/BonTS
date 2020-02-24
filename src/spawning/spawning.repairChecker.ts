import _ from "lodash";

import { CreepRole } from "enums/enum.roles";

export class RepairChecker {
    private room!: Room;
    private rampartMaxRepairThreshold: number = 2000000;
    private builderSpawnThreshold: number = 100000;

    constructor(room: Room) {
        this.room = room;
    }

    public RepairNeeded(): boolean {
        if (
            !this.RepairCreepRequested() &&
            !this.HaveRepairWorker() &&
            (this.room.memory.target ||
                this.room.memory.constructionSites.length > 0 ||
                this.HaveDamagedRamparts() ||
                this.HaveDamagedContainers())
        ) {
            return true;
        }
        return false;
    }

    public RepairMaintain(): boolean {
        if (!this.RepairCreepRequested() && !this.HaveRepairWorker()) {
            return true;
        }
        return false;
    }

    private RepairCreepRequested(): boolean {
        for (const spawn of _.values(Game.spawns).filter(s => s.room.name === this.room.name)) {
            const creepRequest = _.filter(spawn.room.memory.creepRequest, cr => {
                return cr.role === CreepRole.builder;
            });
            if (creepRequest) {
                if (creepRequest.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    private HaveRepairWorker(): boolean {
        // first see if we already have a local repairer.
        const roomData = Memory.roleRoomMap[this.room.name];
        if (roomData) {
            if (roomData[CreepRole.builder] > 0) {
                return true;
            }
        }
        return false;
    }

    private HaveDamagedContainers(): boolean {
        return this.HaveDamagedStructure(STRUCTURE_CONTAINER, 250000, 250000 / 5, 2 * (250000 / 5));
    }

    private HaveDamagedRamparts(): boolean {
        return this.HaveDamagedStructure(
            STRUCTURE_RAMPART,
            this.rampartMaxRepairThreshold,
            100000,
            this.builderSpawnThreshold
        );
    }

    private HaveDamagedStructure(
        structureType: StructureConstant,
        individualThreshold: number,
        individualDifference: number,
        totalThreshold: number
    ): boolean {
        // console.log(`structureType: ${structureType} | individualThreshold: ${individualThreshold} | individualDifference: ${individualDifference} | totalThreshold : ${totalThreshold} `);
        const structures = this.room.find(FIND_STRUCTURES, {
            filter: structure => {
                return (
                    structure.structureType === structureType &&
                    individualThreshold - structure.hits > individualDifference
                );
            }
        });
        // console.log(JSON.stringify(structures));
        if (structures) {
            if (structures.length > 0) {
                let totalDamage: number = 0;
                _.forEach(structures, s => (totalDamage += individualThreshold - s.hits));
                if (totalDamage > totalThreshold) {
                    return true;
                }
            }
        }
        return false;
    }
}
