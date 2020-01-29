import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../cycle/manager.dedicatedCreepRequester";
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
            this.checkPersonnel();
        }
    }

    private checkPersonnel() {
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
    private requestharvester() {
        const harvestName: string = `dharvest${this.harvest.vein}${Game.cpu.bucket}`;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        const orders: CreepOrder = {
            target: this.harvest.roomName,
            independentOperator: false
        };
        dcr.createdDedicatedCreepRequest({
            dedication: this.harvest.vein,
            role: CreepRole.harvester,
            specifiedName: harvestName,
            precious: undefined,
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
