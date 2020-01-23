interface IExpeditionResults {
    targetIds: string[];
    name: string;
}

interface IExpeditionResultsHandlerConstructor {
    new(targetIds: string[], name: string): IExpeditionResultHandler;
}

interface IExpeditionResultHandler extends IExpeditionResults {
    actionRoutine(spawn: StructureSpawn): void;
    storeResults(spawn: StructureSpawn): void;
}

