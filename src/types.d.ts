interface CreepMemory {
    //* Required
    role: number;
    working: boolean;

    orders?: CreepOrder | null;

    // * Id Caching
    dedication?: string | null;
    precious?: string | null;
    preciousPosition?: { x: number; y: number } | null;
    home?: string | null;

    //* Path Caching
    path?: PathStep[] | null;
    stuckCount?: number | null;
    moved?: boolean | null;

    //* Efficiency Processing Trade Off Modifiers
    ignoreLinks?: boolean | null;
    repairWhileMove?: boolean | null;

    //* Combat
    hitsLast?: number | null;
    mrf?: boolean;
}

interface RoomMemory {
    // TODO remove obsolete
    era: number;

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
    uuid: number;
    log: any;
    cycle: number;
    roleRoomMap: Dictionary<number[]>;
    expeditions: Expedition[];
    showReserved: boolean;
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
