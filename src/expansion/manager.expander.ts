import { CreepRole } from "enums/enum.roles";
import { ExpeditionManager } from "./manager.expedition";
import _ from "lodash";
import { ContainerExpansion } from "building/building.containerExpansion";

export class Expander {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public mineExpansion() {
        // If we have an untapped local container location, first expand to it.
        if (!this.buildInProgress() && (this.spawn.memory.sourcesUtilized || !this.localSourceExpansion())) {
            // start a remote mine expansion request.
            if (!this.spawn.memory.remoteMineExpansionInProgress) {
                this.remoteMineExpansion();
            }
        }
    }

    private buildInProgress(): boolean {
        if (this.spawn.memory.buildProjects) {
            if (this.spawn.memory.buildProjects.length > 0) {
                return true;
            }
        }
        return false;
    }

    private localSourceExpansion(): boolean {
        if (!this.spawn.memory.remoteMines) {
            this.spawn.memory.remoteMines = [];
        }
        let containerUsage: number = 0;
        if (this.spawn.room.memory.containerMap) {
            containerUsage += this.spawn.room.memory.containerMap.length;
        }
        if (containerUsage === 2) {
            this.spawn.memory.sourcesUtilized = true;
            return false;
        }
        const sources: Source[] | null = this.getSources();
        if (sources) {
            if (containerUsage < sources.length) {
                const containerExpansion: ContainerExpansion = new ContainerExpansion(
                    this.spawn,
                    this.spawn.room,
                    this.spawn.pos,
                    false
                );
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
                const sourceIds = _.map(this.spawn.room.memory.sourceMap, s => s.id);
                if (sourceIds) {
                    if (sourceIds.length > 0) {
                        return _.compact(
                            _.map(sourceIds, id => {
                                return Game.getObjectById(id);
                            })
                        );
                    }
                }
            }
        }
        const sources: Source[] | null = this.spawn.room.find(FIND_SOURCES);
        return sources;
    }

    public remoteMineExpansion() {
        // Create the expedition object to find a source.
        this.createExpedition(2, "remoteMiningSource", FIND_SOURCES);
        this.requestScout();
    }

    private createExpedition(searchDepth: number, expeditionTypeName: string, findConstant: FindConstant) {
        const searchTreeOrigin: ScreepsSearchTree = {
            nodeName: this.spawn.room.name,
            children: [],
            scanned: true,
            assignedCreep: ""
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
            assignedCreeps: []
        };
        if (!Memory.expeditions) {
            Memory.expeditions = [];
        }
        Memory.expeditions.push(expedition);
        const em: ExpeditionManager = new ExpeditionManager();
        em.initialExpansion(searchTreeOrigin, expedition);
        this.spawn.memory.remoteMineExpansionInProgress = true;
    }

    private requestScout() {
        const creepRequest: CreepRequest = {
            role: CreepRole.scout,
            body: [MOVE],
            memory: null
        };
        if (!this.spawn.memory.creepRequest) {
            this.spawn.memory.creepRequest = [];
        }

        this.spawn.memory.creepRequest.push(creepRequest);
    }
}
