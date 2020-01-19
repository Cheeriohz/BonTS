interface CreepMemory {
  role: number;
  working: boolean;
}

interface RoomMemory {
  era: number;
  sourceMap: string[][];
  containerMap: string[][];
  constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
  controller: Id<StructureController>
}

interface Memory {
  uuid: number;
  log: any;
  cycle: number;
  roleRoomMap: Dictionary<number[]>;
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



