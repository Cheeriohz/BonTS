interface CreepMemory {
  role: number;
  working: boolean;
  orders: CreepOrder | null;
}

interface CreepOrder {
  target: string;
  independentOperator: boolean;
}

interface ScoutOrder extends CreepOrder {
  searchTarget: FindConstant;
}

interface RoomMemory {
  era: number;
  sourceMap: string[][];
  containerMap: string[][];
  constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
  controller: Id<StructureController> | null;
  sourceLinks: Id<StructureLink>[] | null
  dumpLinks: Id<StructureLink>[] | null
}

interface SpawnMemory {
  reassess: boolean | null;
  remoteCreepRequest: CreepRequest[] | null;
  remoteMineCount: number | null;
  remoteMineExpansionInProgress: boolean | null;
  expeditionResults: IExpeditionResults[] | null;
  rcl: number | null;
  rclUpgrades: RCLUpgradeEvent[] | null
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



