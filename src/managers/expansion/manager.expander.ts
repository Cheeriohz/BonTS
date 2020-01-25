import { CreepRole } from "enums/enum.roles";
import { ExpeditionManager } from "./manager.expedition";
import _ from "lodash";
import { ContainerExpansion } from "managers/building/manager.containerExpansion";

export class Expander {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public mineExpansion() {
        // If we have an untapped local container location, first expand to it.
        if (this.spawn.memory.sourcesUtilized || !this.localSourceExpansion()) {
            // start a remote mine expansion request.
            if (!this.spawn.memory.remoteMineExpansionInProgress) {
                this.remoteMineExpansion();
            }
        }
    }

    private localSourceExpansion(): boolean {
        if (!this.spawn.memory.remoteMineCount) {
            this.spawn.memory.remoteMineCount = 0;
        }
        const containerUsage: number = this.spawn.memory.remoteMineCount + this.spawn.room.memory.containerMap?.length
        if (containerUsage === 3) {
            return false;
        }
        const sources: Source[] | null = this.getSources()
        if (sources) {
            if (containerUsage < sources.length) {
                const containerExpansion: ContainerExpansion = new ContainerExpansion(this.spawn.room, this.spawn.pos, true);
                containerExpansion.checkForSourceExpansion(sources);
                return true;
            }
        }
        this.spawn.memory.sourcesUtilized = true;
        return false;
    }

    private getSources(): Source[] | null {
        if (this.spawn.room.memory.sourceMap) {
            if (this.spawn.room.memory.sourceMap.length > 0) {
                const sourceIds = _.map(this.spawn.room.memory.sourceMap, (s) => s.id);
                if (sourceIds) {
                    if (sourceIds.length > 0) {
                        return _.compact(_.map(sourceIds, (id) => { return Game.getObjectById(id); }));
                    }
                }
            }
        }
        const sources: Source[] | null = this.spawn.room.find(FIND_SOURCES);
        return sources;
    }

    public remoteMineExpansion() {
        // Create the expedition object to find a source.
        this.createExpedition(4, "remoteMiningSource", FIND_SOURCES);
        this.requestScout();
    }

    private createExpedition(searchDepth: number, expeditionTypeName: string, findConstant: FindConstant) {
        const searchTreeOrigin: ScreepsSearchTree = {
            nodeName: this.spawn.room.name,
            children: [],
            scanned: true,
            assignedCreep: "",
        };
        const expeditionProgress: ExpeditionProgress = {
            searchTreeOriginNode: searchTreeOrigin,
            complete: false,
            foundTargets: [],
            searchDepth: 0,
            maxDepth: searchDepth,
            plottedRooms: [this.spawn.room.name]
        };
        const expedition: Expedition = {
            target: findConstant,
            additionalPersonnelNeeded: 1,
            spawnOrigin: this.spawn.name,
            expeditionTypeName: expeditionTypeName,
            progress: expeditionProgress,
            assignedCreeps: [],
        };
        if (!Memory.expeditions) {
            Memory.expeditions = [];
        }
        Memory.expeditions.push(expedition);
        const em: ExpeditionManager = new ExpeditionManager(false);
        em.initialExpansion(searchTreeOrigin, expedition);
        this.spawn.memory.remoteMineExpansionInProgress = true;
    }

    private requestScout() {
        const creepRequest: CreepRequest = {
            role: CreepRole.scout,
            body: [MOVE]
        };
        if (!this.spawn.memory.remoteCreepRequest) {
            this.spawn.memory.remoteCreepRequest = [];
        }

        this.spawn.memory.remoteCreepRequest.push(creepRequest);

    }


}



