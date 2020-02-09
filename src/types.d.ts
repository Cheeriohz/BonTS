interface CreepMemory {
    //* Required
    role: number;
    working: boolean;

    // * Assistive Large Memory Blocks
    orders?: CreepOrder | null;
    taxi?: Taxi | null;

    // * Id Caching
    dedication?: string | null;
    precious?: string | null;
    preciousPosition?: { x: number; y: number } | null;
    home?: string | null;
    repair?: string | null;

    //* Path Caching
    path?: PathStep[] | null;
    stuckCount?: number | null;
    moved?: boolean | null;
    activeTaxi?: boolean;

    //* Efficiency Processing Trade Off Modifiers
    ignoreLinks?: boolean | null;
    repairWhileMove?: boolean | null;

    //* Combat
    hitsLast?: number | null;
    mrf?: boolean;
}

interface RoomMemory {
    //* Object Caching
    sourceMap: Assignment[];
    containerMap: Assignment[] | null;
    dropMap: AssignmentPosition[] | null;

    //* Id Caching
    constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
    controller: Id<StructureController> | null;
    sourceLinks: Id<StructureLink>[] | null;
    dumpLinks: Id<StructureLink>[] | null;
    spawns: Id<StructureSpawn>[] | null;

    //* Deployment Structures
    mine: Mine | null;

    //* Building
    reservedBuilds?: BuildOrder[] | null;
    buildProjects?: BuildProject[] | null;

    //* Combat
    target?: string | null;

    //* Spawn Management
    templates?: RoomSpawnTemplates;
    roleTargets?: number[];

    //* RCL Management
    rcl: number | null;
    rclUpgrades: RCLUpgradeEvent[] | null;
    lowRCLBoost: boolean;
    staticUpgraders: boolean;
}

interface SpawnMemory {
    reassess: boolean | null;
    creepRequest: CreepRequest[] | null;
    dedicatedCreepRequest: DedicatedCreepRequest[] | null;
    remoteMineExpansionInProgress: boolean | null;
    remoteMines: RemoteMine[] | null;
    expeditionResults: IExpeditionResults[] | null;
    sourcesUtilized: boolean;
    remoteHarvests: RemoteHarvest[] | null;
    remoteReservations: RemoteReservation[] | null;
    roomHarass: RoomHarrass[] | null;
    remotePatrols: RemotePatrol[] | null;
}

interface Memory {
    //* Global Debug Tools
    showReserved: boolean;
    log: any;

    //* Integral Game Memory
    cycle: number;

    //* Creep Tracking
    roleRoomMap: Dictionary<number[]>;

    //? Expeditions - Is this necessary anymore?
    expeditions: Expedition[];

    //* Scouting
    scouting: Scouting;
}

interface Dictionary<T> {
    [index: string]: T;
}

interface Taxi {
    client: string;
    destination: RoomPosition;
    priority: number;
    originalRole: number;
    taxiRoute: PathStep[] | null;
}

// `global` extension samples
declare namespace NodeJS {
    interface Global {
        pr: Profiler;
        log: any;
    }
}
