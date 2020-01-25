interface CreepMemory {
  role: number;
  working: boolean;
  orders: CreepOrder | null;
  ignoreLinks: boolean | null;
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
  sourceMap: Assignment[];
  containerMap: Assignment[];
  constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
  controller: Id<StructureController> | null;
  sourceLinks: Id<StructureLink>[] | null;
  dumpLinks: Id<StructureLink>[] | null;
}

interface Assignment {
  id: string;
  assigned: string[];
}

interface SpawnMemory {
  reassess: boolean | null;
  remoteCreepRequest: CreepRequest[] | null;
  remoteMineCount: number | null;
  remoteMineExpansionInProgress: boolean | null;
  expeditionResults: IExpeditionResults[] | null;
  rcl: number | null;
  rclUpgrades: RCLUpgradeEvent[] | null;
  sourcesUtilized: boolean;
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



