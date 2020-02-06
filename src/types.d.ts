interface CreepMemory {
    role: number;
    working: boolean;
    orders?: CreepOrder | null;
    ignoreLinks?: boolean | null;
    dedication?: string | null;
    precious?: string | null;
    home?: string | null;
    path?: PathStep[] | null;
    stuckCount?: number | null;
    moved?: boolean | null;
    repairWhileMove?: boolean | null;
    hitsLast?: number | null;
    mrf?: boolean;
}

interface RoomMemory {
    spawns: string[] | null;
    era: number;
    sourceMap: Assignment[];
    containerMap: Assignment[] | null;
    constructionSites: Id<ConstructionSite<BuildableStructureConstant>>[];
    controller: Id<StructureController> | null;
    sourceLinks: Id<StructureLink>[] | null;
    dumpLinks: Id<StructureLink>[] | null;
    mine: Mine | null;
    reservedBuilds?: BuildOrder[] | null;
    target?: string | null;
}

interface SpawnMemory {
    reassess: boolean | null;
    creepRequest: CreepRequest[] | null;
    dedicatedCreepRequest: DedicatedCreepRequest[] | null;
    remoteMineExpansionInProgress: boolean | null;
    remoteMines: RemoteMine[] | null;
    expeditionResults: IExpeditionResults[] | null;
    rcl: number | null;
    rclUpgrades: RCLUpgradeEvent[] | null;
    sourcesUtilized: boolean;
    buildProjects: BuildProject[] | null;
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
    killswitch: boolean;
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
