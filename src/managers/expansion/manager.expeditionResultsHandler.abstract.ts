
export abstract class ExpeditionResultsHandler implements IExpeditionResultHandler {
    targetIds: string[];
    name: string;
    constructor(targetIds: string[], name: string) {
        this.targetIds = targetIds;
        this.name = name;
    };

    abstract actionRoutine(spawn: StructureSpawn): void;
    abstract storeResults(spawn: StructureSpawn): void;
}
