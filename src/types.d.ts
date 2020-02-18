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
    dropOffLocation?: { x: number; y: number } | null;
    home?: string | null;
    repair?: string | null;
    adjLink?: Id<StructureLink> | null;

    //* Edge Case Management
    time?: number;

    //* Path Caching
    path?: PathStep[] | null;
    stuckCount?: number | null;
    moved?: boolean | null;
    activeTaxi?: boolean;

    //* Efficiency Processing Trade Off Modifiers
    ignoreLinks?: boolean | null;
    repairWhileMove?: boolean | null;
    tick?: number | null;
    upgraderDuty?: boolean;

    //* Combat
    hitsLast?: number | null;
    mrf?: boolean;
    heal?: string | null;
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
    remoteMines: RemoteMine[] | null;
    remoteReservations: RemoteReservation[] | null;
    remotePatrols: RemotePatrol[] | null;

    //* Building
    reservedBuilds?: BuildOrder[] | null;
    buildProjects?: BuildProject[] | null;
    naturalDistanceTransform?: number[] | null;
    structureDistanceTransform?: number[] | null;
    roadAgnosticDistanceTransform?: number[] | null;
    extensionAgnosticDistanceTransform?: number[] | null;

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
    upgraderTaxi: boolean;
    linksActive: boolean;
}

interface SpawnMemory {
    reassess: boolean | null;
    creepRequest: CreepRequest[] | null;
    dedicatedCreepRequest: DedicatedCreepRequest[] | null;
    remoteMineExpansionInProgress: boolean | null;
    expeditionResults: IExpeditionResults[] | null;
    sourcesUtilized: boolean;
    remoteHarvests: RemoteHarvest[] | null;
    roomHarass: RoomHarrass[] | null;
}

interface Memory {
    //* Global Debug Tools
    showReserved?: string;
    structureDT?: string;
    roadAgDT?: string;
    log: any;
    readyForExpansion: boolean;

    //* Integral Game Memory
    cycle: number;
    creepTicker: number;

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
    arrivalDistance?: number;
}

// `global` extension samples
declare namespace NodeJS {
    interface Global {
        pr: Profiler;
        log: any;
        __profiler_enabled__: boolean;
    }
}
