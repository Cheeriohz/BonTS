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
    configured?: boolean;
    distance?: number;
    haulerCount?: number;
    haulerBody?: BodyPartConstant[];
    cycleIterator?: number;
}

interface RemoteHarvest extends PathingLookup {
    vein: Id<Mineral> | Id<Source>;
    roomName: string;
    harvesters: string[] | null;
    reserved: boolean;
    type: ResourceConstant;
}

interface RoomHarrass extends PathingLookup {
    roomName: string;
    pauseToTime: number;
    distance: number;

    knights: string[] | null;
    knightCap: number;
    kStrength: number;
    kHeal: number;

    archers: string[] | null;
    archerCap: number;
    aStrength: number;
    aHeal: number;

    downgrader: string | null;
    dgStrength: number;
    dgClaim?: boolean;
    reassign: boolean;
}

interface RemotePatrol extends PathingLookup {
    roomName: string;
    checkRooms: string[];
    knights: string[] | null;
    count: number;
}

interface RemoteReservation {
    roomName: string;
    spawnTime: number;
    leadTime: number;
}

interface PathingLookup {
    pathingLookup: Dictionary<PathStep[][]>;
}
