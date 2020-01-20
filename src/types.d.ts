
interface CreepMemory {
  role: number;
  working: boolean;
  orders: CreepOrder | null;
}

interface CreepOrder {
  target: string;
}

interface ScoutOrder extends CreepOrder {
  roomPath: string[];
  independentOperator: boolean;
  searchTarget: FindConstant;
}

interface RoomMemory {
  era: number;
  sourceMap: string[][];
  containerMap: string[][];
  constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
  controller: Id<StructureController>
}

interface SpawnMemory {
  remoteCreepRequest: CreepRequest[];
  remoteMineCount: number;
  remoteMineExpansionInProgress: boolean;
}

interface CreepRequest {
  role: number;
  body: any[];
}

interface Memory {
  uuid: number;
  log: any;
  cycle: number;
  roleRoomMap: Dictionary<number[]>;
  expeditions: Expedition[];
}

interface Expedition {
  target: FindConstant;
  additionalPersonnelNeeded: number;
  spawnOrigin: string;
  progress: ExpeditionProgress;
  assignedCreeps: string[];
}

interface ExpeditionProgress {
  searchTreeOriginNode: ScreepsSearchTree;
  complete: boolean;
  foundTargets: string[];
}

interface ScreepsSearchTree {
  roomName: string;
  children: ScreepsSearchTree[];
  scanned: boolean;
  assignedCreep: string;
}


interface Dictionary<T> {
  [index: string]: T;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    pr: Profiler;
    log: any;
  }
}



