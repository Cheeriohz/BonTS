import { ExpeditionResultsHandler } from "./manager.expeditionResultsHandler.abstract";


export class remoteMineExpeditionHandler extends ExpeditionResultsHandler {
    targetIds: string[];
    name: string;
    constructor(targetIds: string[], name: string) {
        super(targetIds, name);
        this.targetIds = targetIds;
        this.name = name;
    }

    public actionRoutine(spawn: StructureSpawn) {
        throw "Not Implemented";
    }

    public storeResults(spawn: StructureSpawn) {
        // console.log("Storing Remote Mining Expedition Results");
        // console.log(`targetIds: ${this.targetIds} | name: ${this.name}`);
        const expeditionResults = { targetIds: this.targetIds, name: this.name };
        // console.log(`expeditionResults: ${JSON.stringify(expeditionResults)}`);
        if (!spawn.memory.expeditionResults) {
            spawn.memory.expeditionResults = [];
        }
        spawn.memory.expeditionResults.push(expeditionResults);
    }
}
