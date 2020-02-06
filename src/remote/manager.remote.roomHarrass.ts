import _ from "lodash";
import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "cycle/manager.dedicatedCreepRequester";

export class RoomHarassManager {
    spawn!: StructureSpawn;
    harass!: RoomHarrass;

    constructor(spawn: StructureSpawn, harass: RoomHarrass) {
        this.spawn = spawn;
        this.harass = harass;
    }

    public manageHarass() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.harass.knights === null) {
            this.harass.knights = [];
        }

        if (this.roomSafeMode()) {
            return;
        }
        this.maintainHarrassment();
    }

    private maintainHarrassment() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.harass.knights) {
            if (this.harassPreSpawn()) {
                this.requestKnight();
                return;
            }
            this.removeUnusedknights();
            if (this.harass.knights.length < this.harass.knightCap) {
                this.requestKnight();
            }
        } else {
            this.harass.knights = [];
            this.requestKnight();
        }
        if (this.harass.archers) {
            this.removeUnusedArchers();
            if (this.harass.archers.length < this.harass.archerCap) {
                this.requestArcher();
            }
        } else {
            this.harass.archers = [];
            this.requestArcher();
        }
    }

    private harassPreSpawn(): boolean {
        return false;
    }

    private removeUnusedknights() {
        for (const knight of this.harass.knights!) {
            if (!Game.creeps[knight]) {
                _.remove(this.harass.knights!, h => {
                    return h === knight;
                });
            }
        }
    }

    private removeUnusedArchers() {
        for (const archer of this.harass.archers!) {
            if (!Game.creeps[archer]) {
                _.remove(this.harass.archers!, h => {
                    return h === archer;
                });
            }
        }
    }

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.orders && dc.orders.target === this.harass.roomName && dc.role === role;
        });
    }

    private requestKnight() {
        if (!this.creepInQueue(CreepRole.knight)) {
            const knightName: string = `knight${Game.time.toPrecision(8)}`;
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
                orders: orders
            });
            if (this.harass.knights!.length > 0) {
                this.harass.knights?.push(knightName);
            } else {
                this.harass.knights = [knightName];
            }
        }
    }

    private requestArcher() {
        if (!this.creepInQueue(CreepRole.knight)) {
            const archerName: string = `archer${Game.time.toPrecision(8)}`;
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
                orders: orders
            });
            if (this.harass.archers!.length > 0) {
                this.harass.archers?.push(archerName);
            } else {
                this.harass.archers = [archerName];
            }
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
}
