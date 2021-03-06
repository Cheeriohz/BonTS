import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../spawning/manager.dedicatedCreepRequester";
import _ from "lodash";

export class RemoteHarvestManager {
    spawn!: StructureSpawn;
    harvest!: RemoteHarvest;

    constructor(spawn: StructureSpawn, harvest: RemoteHarvest) {
        this.spawn = spawn;
        this.harvest = harvest;
    }

    public manageharvest(checkPersonnel: boolean) {
        if (checkPersonnel) {
            if (this.harvest.type === RESOURCE_ENERGY) {
                this.checkSourcePersonnel();
            } else {
                this.checkMinePersonnel();
            }
        }
    }

    private checkMinePersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.harvest.harvesters === null) {
            if (this.checkExtractorCompletion()) {
                this.harvest.harvesters = [];
            } else {
                return;
            }
        }

        if (this.mineralDormant()) {
            return;
        }
        if (this.harvest.harvesters) {
            if (this.harvestPreSpawn()) {
                this.requestharvester();
                return;
            }
            this.removeUnusedHarvesters();
            if (this.harvest.harvesters.length < 2) {
                this.requestharvester();
            }
        } else {
            this.harvest.harvesters = [];
            this.requestharvester();
        }
    }

    private checkSourcePersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.harvest.harvesters) {
            if (this.harvestPreSpawn()) {
                this.requestharvester();
                return;
            }
            this.removeUnusedHarvesters();
            if (this.harvest.harvesters.length < 2) {
                this.requestharvester();
            }
        } else {
            this.harvest.harvesters = [];
            this.requestharvester();
        }
    }

    private harvestPreSpawn(): boolean {
        return false;
    }

    private removeUnusedHarvesters() {
        for (const harvester of this.harvest.harvesters!) {
            if (!Game.creeps[harvester]) {
                _.remove(this.harvest.harvesters!, h => {
                    return h === harvester;
                });
            }
        }
    }

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.room.memory.dedicatedCreepRequest, dc => {
            return dc.dedication === this.harvest.vein && dc.role === role;
        });
    }

    private requestharvester() {
        if (!this.creepInQueue(CreepRole.harvester)) {
            const harvestName: string = `rharv${this.harvest.vein}${Memory.creepTicker}`;
            Memory.creepTicker++;
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: CreepOrder = {
                target: this.harvest.roomName,
                independentOperator: false
            };
            dcr.createdDedicatedCreepRequest({
                dedication: this.harvest.vein,
                role: CreepRole.harvester,
                specifiedName: harvestName,
                precious: this.harvest.type,
                isRemote: true,
                orders: orders
            });
            if (this.harvest.harvesters!.length > 0) {
                this.harvest.harvesters?.push(harvestName);
            } else {
                this.harvest.harvesters = [harvestName];
            }
        }
    }

    private mineralDormant(): boolean {
        const vein: Mineral | Deposit | null = Game.getObjectById<Mineral | Deposit>(this.harvest.vein);
        if (vein) {
            const mineralAmount = _.get(vein, "mineralAmount", null);
            if (mineralAmount) {
                // TODO Make this more robust
                if (mineralAmount < 2000) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    private checkExtractorCompletion(): boolean {
        const mineral: Mineral | null = Game.getObjectById(this.harvest.vein);
        if (mineral) {
            if (mineral.pos.lookFor(LOOK_STRUCTURES).length > 0) {
                return true;
            }
        }
        return false;
    }
}
