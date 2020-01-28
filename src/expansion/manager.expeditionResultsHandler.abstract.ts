export abstract class ExpeditionResultsHandler implements IExpeditionResultHandler {
  targets: ExpeditionFoundTarget[];
  name: string;
  constructor(targets: ExpeditionFoundTarget[], name: string) {
    this.targets = targets;
    this.name = name;
  }

  abstract actionRoutine(spawn: StructureSpawn): void;
  abstract storeResults(spawn: StructureSpawn): void;
}
