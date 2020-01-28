interface IExpeditionResults {
  targets: ExpeditionFoundTarget[];
  name: string;
}

interface IExpeditionResultsHandlerConstructor {
  new (targets: ExpeditionFoundTarget[], name: string): IExpeditionResultHandler;
}

interface IExpeditionResultHandler extends IExpeditionResults {
  actionRoutine(spawn: StructureSpawn): void;
  storeResults(spawn: StructureSpawn): void;
}

interface Expedition {
  target: FindConstant;
  additionalPersonnelNeeded: number;
  spawnOrigin: string;
  expeditionTypeName: string;
  progress: ExpeditionProgress;
  assignedCreeps: string[];
}

interface ExpeditionProgress {
  searchTreeOriginNode: ScreepsSearchTree;
  plottedRooms: string[];
  complete: boolean;
  foundTargets: ExpeditionFoundTarget[];
  searchDepth: number;
  maxDepth: number;
}

interface ExpeditionFoundTarget {
  id: string;
  roomName: string;
}

interface ScreepsSearchTree {
  nodeName: string;
  children: ScreepsSearchTree[];
  scanned: boolean;
  assignedCreep: string;
}

interface CreepOrder {
  target: string;
  independentOperator: boolean;
}

interface ScoutOrder extends CreepOrder {
  searchTarget: FindConstant;
}

interface MineOrder extends CreepOrder {
  resourceType: ResourceConstant;
}
