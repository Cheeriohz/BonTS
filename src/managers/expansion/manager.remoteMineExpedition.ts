import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";


export class remoteMineExpeditionHandler extends ExpeditionResultsHandler {

    constructor(targetIds: string[], name: string) {
        super(targetIds, name);
    }

    public actionRoutine(spawn: StructureSpawn) {
        throw "Not Implemented";
    }

    public storeResults(spawn: StructureSpawn) {
        const expeditionResults = { targetIds: super.targetIds, name: super.name };
        if (!spawn.memory.expeditionResults) {
            spawn.memory.expeditionResults = [];
        }
        spawn.memory.expeditionResults.push(expeditionResults);
    }
}
