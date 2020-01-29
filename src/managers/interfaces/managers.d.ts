interface RemoteMine extends PathingLookup {
  extractorId: Id<StructureExtractor> | null;
  containerId: Id<StructureContainer> | null;
  miner: string | null;
  haulers: string[] | null;
  type: MineralConstant | DepositConstant | RESOURCE_ENERGY;
  vein: Id<Mineral> | Id<Deposit> | Id<Source>;
  roomName: string;
}

interface RemoteHarvest extends PathingLookup {
  vein: Id<Source>;
  roomName: string;
  harvesters: string[] | null;
}

interface Mine {
  extractorId: Id<StructureExtractor>;
  containerId: Id<StructureContainer>;
  miner: string;
  hauler: string;
  type: MineralConstant | DepositConstant;
  vein: Id<Mineral> | Id<Deposit>;
}

interface PathingLookup {
  pathingLookup: Dictionary<PathStep[][]>;
}
