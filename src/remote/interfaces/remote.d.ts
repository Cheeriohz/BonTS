interface RemoteDispatchRequest {
    departing: boolean;
    creep: Creep;
}

interface RemoteMine extends PathingLookup {
    extractorId: Id<StructureExtractor> | null;
    containerId: Id<StructureContainer> | null;
    miner: string | null;
    haulers: string[] | null;
    type: MineralConstant | DepositConstant | RESOURCE_ENERGY;
    vein: Id<Mineral> | Id<Deposit> | Id<Source>;
    roomName: string;
    reserved: boolean;
}

interface RemoteHarvest extends PathingLookup {
    vein: Id<Mineral> | Id<Source>;
    roomName: string;
    harvesters: string[] | null;
    reserved: boolean;
    type: ResourceConstant;
}

interface RemoteReservation {
    roomName: string;
    spawnTime: number;
    leadTime: number;
}

interface PathingLookup {
    pathingLookup: Dictionary<PathStep[][]>;
}
