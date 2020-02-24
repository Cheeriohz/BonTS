import { CreepRole } from "enums/enum.roles";
import { ExpeditionManager } from "./manager.expedition";
import _ from "lodash";
import { LocalExpansion } from "building/building.localExpansion";

export class Expander {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    // ? Entire class is borderline obsolete. Might be reusable after some refactoring.
    public mineExpansion() {
        // If we have an untapped local container location, first expand to it.
        if (this.spawn.room.controller!.level > 2) {
            if (!this.buildInProgress() && this.spawn.memory.sourcesUtilized) {
                // start a remote mine expansion request.
                if (!this.spawn.memory.remoteMineExpansionInProgress) {
                    this.remoteMineExpansion();
                }
            }
        }
    }

    private buildInProgress(): boolean {
        if (this.spawn.room.memory.buildProjects) {
            if (this.spawn.room.memory.buildProjects.length > 0) {
                return true;
            }
        }
        return false;
    }

    private getSources(): Source[] | null {
        if (this.spawn.room.memory.sourceMap) {
            if (this.spawn.room.memory.sourceMap.length > 0) {
                const sourceIds = _.map(this.spawn.room.memory.sourceMap, s => s.id);
                if (sourceIds) {
                    if (sourceIds.length > 0) {
                        return _.compact(
                            _.map(_.compact(sourceIds), id => {
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
        if (!this.spawn.room.memory.creepRequest) {
            this.spawn.room.memory.creepRequest = [];
        }

        this.spawn.room.memory.creepRequest.push(creepRequest);
    }
}
