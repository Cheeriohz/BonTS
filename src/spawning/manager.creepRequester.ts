import { CreepRole } from "enums/enum.roles";
import _ from "lodash";
import { RepairChecker } from "./spawning.repairChecker";
import { BurnoffChecker } from "./spawning.burnoffChecker";

// This requester is for common creep requests for relatively generic purposes.
// Requests here should ensure we don't create infinite requests without external request management.
export class CreepRequester {
    private spawn!: StructureSpawn;
    private rampartMaxRepairThreshold: number = 2000000;
    private builderSpawnThreshold: number = 100000;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public RequestIndependentScout() {
        const memory: CreepMemory = {
            role: CreepRole.scout,
            working: true,
            orders: {
                target: "",
                independentOperator: true
            }
        };
        const scoutRequest: CreepRequest = { role: CreepRole.scout, body: [MOVE], memory: memory };
        if (!this.spawn.room.memory.creepRequest) {
            this.spawn.room.memory.creepRequest = [];
        }
        this.spawn.room.memory.creepRequest.push(scoutRequest);
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
                independentOperator: false
            }
        };
        const scoutRequest: CreepRequest = { role: CreepRole.scout, body: [MOVE], memory: memory };
        if (!this.spawn.room.memory.creepRequest) {
            this.spawn.room.memory.creepRequest = [];
        }
        this.spawn.room.memory.creepRequest.push(scoutRequest);
    }

    public MaintainBuilder(): void {
        const repairChecker: RepairChecker = new RepairChecker(this.spawn.room);
        if (repairChecker.RepairMaintain()) {
            this.RequestRepairBot();
        }
    }

    public CheckForRepairNeed(): void {
        const repairChecker: RepairChecker = new RepairChecker(this.spawn.room);
        if (repairChecker.RepairNeeded()) {
            this.RequestRepairBot();
        }
    }

    public CheckForUpgraderDumping(): void {
        const burnChecker: BurnoffChecker = new BurnoffChecker(this.spawn.room);
        if (burnChecker.CheckForBurnoff()) {
            this.RequestBurnUpgrader();
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
        if (this.spawn.room.memory.creepRequest) {
            for (const rq of this.spawn.room.memory.creepRequest) {
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
            body: this.spawn.room.memory.templates![CreepRole.builder]
        };
        if (!this.spawn.room.memory.creepRequest) {
            this.spawn.room.memory.creepRequest = [];
        }
        this.spawn.room.memory.creepRequest.push(builderRequest);
    }

    private RequestBurnUpgrader() {
        const builderRequest: CreepRequest = {
            role: CreepRole.upgrader,
            body: this.spawn.room.memory.templates![CreepRole.upgrader]
        };
        if (!this.spawn.room.memory.creepRequest) {
            this.spawn.room.memory.creepRequest = [];
        }
        this.spawn.room.memory.creepRequest.push(builderRequest);
        this.EnableTopper();
    }

    private EnableTopper() {
        Memory.roleRoomMap[this.spawn.room.name][CreepRole.topper] = Math.max(
            Memory.roleRoomMap[this.spawn.room.name][CreepRole.topper],
            1
        );
    }
}
