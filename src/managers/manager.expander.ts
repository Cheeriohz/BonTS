import { CreepRole } from "enums/enum.roles";

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
        this.createExpedition(spawn);
        this.requestScout(spawn);
    }

    private createExpedition(spawn: StructureSpawn) {
        const searchTreeOrigin: ScreepsSearchTree = {
            roomName: spawn.room.name,
            children: [],
            scanned: false,
            assignedCreep: ""
        };
        const expeditionProgress: ExpeditionProgress = {
            searchTreeOriginNode: searchTreeOrigin,
            complete: false,
            foundTargets: []
        };
        const expedition: Expedition = {
            target: FIND_SOURCES,
            additionalPersonnelNeeded: 1,
            spawnOrigin: spawn.name,
            progress: expeditionProgress,
            assignedCreeps: [],
        };
        if (!Memory.expeditions) {
            Memory.expeditions = [];
        }
        Memory.expeditions.push(expedition);
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



