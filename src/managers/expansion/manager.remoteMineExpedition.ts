import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";


export class remoteMineExpeditionHandler extends ExpeditionResultsHandler {

    constructor(targetIds: string[], name: string) {
        super(targetIds, name);
    }

    public actionRoutine(spawn: StructureSpawn) {

    }

    public storeResults(spawn: StructureSpawn) {
        const expeditionResults: IExpeditionResults = { targetIds: super.targetIds, name: super.name };
        if (!spawn.memory.expeditionResults) {
            spawn.memory.expeditionResults = [];
        }
        spawn.memory.expeditionResults.push(expeditionResults);
    }
}
