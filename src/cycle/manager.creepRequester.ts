import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

// This requester is for common creep requests for relatively generic purposes.
// Requests here should ensure we don't create infinite requests without external request management.
export class CreepRequester {
    private spawn!: StructureSpawn;
    private rampartMaxRepairThreshold: number = 1000000;
    private builderSpawnThreshold: number = 100000;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public RequestScoutToRoom(roomName: string) {
        if (this.scoutAlreadyRequested(roomName)) {
            return;
        }
        if (this.rerouteUnusedScout(roomName)) {
            return;
        }
        const memory: CreepMemory = {
            role: CreepRole.scout,
            working: true,
            orders: {
                target: roomName,
                independentOperator: true
            }
        };
        const scoutRequest: CreepRequest = { role: CreepRole.scout, body: [MOVE], memory: memory };
        if (!this.spawn.memory.creepRequest) {
            this.spawn.memory.creepRequest = [];
        }
        this.spawn.memory.creepRequest.push(scoutRequest);
    }

    public MaintainBuilder(): void {
        if (!this.RepairCreepRequested() && !this.HaveRepairWorker()) {
            this.RequestRepairBot();
        }
    }

    public CheckForRepairNeed(): void {
        if (
            !this.RepairCreepRequested() &&
            !this.HaveRepairWorker() &&
            (this.HaveDamagedRamparts() ||
                this.HaveDamagedContainers() ||
                this.spawn.room.memory.constructionSites.length > 0)
        ) {
            this.RequestRepairBot();
        }
    }

    private scoutAlreadyRequested(roomName: string): boolean {
        for (const creep of _.values(Game.creeps)) {
            if (
                creep.memory.role === CreepRole.scout &&
                creep.memory.orders &&
                creep.memory.orders.target === roomName
            ) {
                return true;
            }
        }
        if (this.spawn.memory.creepRequest) {
            for (const rq of this.spawn.memory.creepRequest) {
                if (rq.memory?.role === CreepRole.scout) {
                    if (rq.memory.orders && rq.memory.orders.target === roomName) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private rerouteUnusedScout(roomName: string): boolean {
        for (const creep of _.values(Game.creeps)) {
            if (creep.memory.role === CreepRole.scout && creep.memory.working === false) {
                creep.memory.orders = { target: roomName, independentOperator: true };
                creep.memory.working = true;
                return true;
            }
        }
        return false;
    }

    private RequestRepairBot() {
        const builderRequest: CreepRequest = {
            role: CreepRole.builder,
            body: [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE]
        };
        if (!this.spawn.memory.creepRequest) {
            this.spawn.memory.creepRequest = [];
        }
        this.spawn.memory.creepRequest.push(builderRequest);
    }

    private RepairCreepRequested(): boolean {
        const creepRequest = _.filter(this.spawn.memory.creepRequest, cr => {
            return cr.role === CreepRole.builder;
        });
        if (creepRequest) {
            if (creepRequest.length > 0) {
                return true;
            }
        }
        return false;
    }

    private HaveRepairWorker(): boolean {
        // first see if we already have a local repairer.
        const roomData = Memory.roleRoomMap[this.spawn.room.name];
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
        const structures = this.spawn.room.find(FIND_STRUCTURES, {
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
