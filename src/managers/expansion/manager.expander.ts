import { CreepRole } from "enums/enum.roles";
import { ExpeditionManager } from "./manager.expedition";

export class Expander {

    public mineExpansion(spawn: StructureSpawn) {
        if (spawn) {
            const containerUsage: number = spawn.memory.remoteMineCount + spawn.room.memory.containerMap.length
            // If we have an untapped local container, first expand to it.

            // start a remote mine expansion request.
            if (!spawn.memory.remoteMineExpansionInProgress) {
                this.remoteMineExpansion(spawn);
            }
        }
    }

    public remoteMineExpansion(spawn: StructureSpawn) {
        // Create the expedition object to find a source.
        this.createExpedition(spawn, 4, "remoteMiningSource", FIND_SOURCES);
        this.requestScout(spawn);
    }

    private createExpedition(spawn: StructureSpawn, searchDepth: number, expeditionTypeName: string, findConstant: FindConstant) {
        const searchTreeOrigin: ScreepsSearchTree = {
            nodeName: spawn.room.name,
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
            plottedRooms: [spawn.room.name]
        };
        const expedition: Expedition = {
            target: findConstant,
            additionalPersonnelNeeded: 1,
            spawnOrigin: spawn.name,
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
        spawn.memory.remoteMineExpansionInProgress = true;
    }

    private requestScout(spawn: StructureSpawn) {
        const creepRequest: CreepRequest = {
            role: CreepRole.scout,
            body: [MOVE]
        };
        if (!spawn.memory.remoteCreepRequest) {
            spawn.memory.remoteCreepRequest = [];
        }

        spawn.memory.remoteCreepRequest.push(creepRequest);

    }


}



