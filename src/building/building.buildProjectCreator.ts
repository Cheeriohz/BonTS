import { BuildProjectEnum } from "./interfaces/building.enum";
import _ from "lodash";

export class buildProjectCreator {
    private spawn!: StructureSpawn;
    private room!: Room;
    private roomName!: string;

    constructor(room: Room, spawn: StructureSpawn, roomName?: string) {
        this.room = room;
        this.spawn = spawn;
        if (roomName) {
            this.roomName = roomName;
        } else {
            this.roomName = this.room.name;
        }
    }

    public rebuildRemoteCreate() {
        let buildProject: BuildProject = {
            buildOrders: [],
            roomName: this.roomName,
            activeSites: 1,
            projectType: BuildProjectEnum.RebuildRemote
        };
        if (!this.spawn.room.memory.buildProjects) {
            this.spawn.room.memory.buildProjects = [buildProject];
        } else {
            this.spawn.room.memory.buildProjects.push(buildProject);
        }
    }

    public passThroughCreateMasked(buildOrders: BuildOrder[], bpcEnum: BuildProjectEnum) {
        this.pushBuildProjectToSpawn(buildOrders, bpcEnum);
    }

    public passThroughCreate(buildOrders: BuildOrder[]) {
        this.pushBuildProjectToSpawn(buildOrders, BuildProjectEnum.PassThroughCreate);
    }

    public createBuildProjectSingleSite(pos: RoomPosition, structureType: BuildableStructureConstant) {
        const buildOrder = [{ x: pos.x, y: pos.y, type: structureType }];
        this.pushBuildProjectToSpawn(buildOrder, BuildProjectEnum.SingleConstructionSiteNoFollowUp);
    }

    public createReservedRoads() {
        if (this.room.memory.reservedBuilds) {
            const buildOrders = _.uniq(_.remove(this.room.memory.reservedBuilds, rb => rb.type === STRUCTURE_ROAD));
            if (buildOrders.length > 0) {
                this.pushBuildProjectToSpawn(buildOrders, BuildProjectEnum.PassThroughCreate);
            }
        }
    }

    // Last Pathstep will become an extractor. Next to last pathstep will become a container. Remaining will become roads'
    public createBuildProjectLocalMineExpansion(path: PathStep[], projectType: BuildProjectEnum) {
        const extractorLocation: PathStep | undefined = path.pop();
        if (extractorLocation) {
            let buildOrders: BuildOrder[] = [this.createExtractorBuildOrder(extractorLocation)];
            const containerLocation: PathStep | undefined = path.pop();
            if (containerLocation) {
                buildOrders.push(this.createContainerBuildOrder(containerLocation));
                this.fillPathWithRoads(path, buildOrders);
            }
            this.pushBuildProjectToSpawn(buildOrders, projectType);
        }
    }

    public createBuildProjectContainerExpansion(buildOrders: BuildOrder[]) {
        this.pushBuildProjectToSpawn(buildOrders, BuildProjectEnum.LocalContainerExpansion);
    }

    public createSpawnBuildProject(pos: RoomPosition, scoutInfo: RoomScout) {
        const spawnBuildOrder: BuildOrder[] = [{ x: pos.x, y: pos.y, type: STRUCTURE_SPAWN }];
        if (!this.spawn.memory.remoteHarvests) {
            this.spawn.memory.remoteHarvests = [];
        }
        const newRemoteHarvests: RemoteHarvest[] = [
            {
                vein: scoutInfo.sourceA!,
                harvesters: [],
                roomName: this.roomName,
                type: RESOURCE_ENERGY,
                pathingLookup: {},
                reserved: false
            },
            {
                vein: scoutInfo.sourceB!,
                harvesters: [],
                roomName: this.roomName,
                type: RESOURCE_ENERGY,
                pathingLookup: {},
                reserved: false
            }
        ];

        this.spawn.memory.remoteHarvests = _.concat(this.spawn.memory.remoteHarvests, newRemoteHarvests);
        this.pushBuildProjectToSpawn(spawnBuildOrder, BuildProjectEnum.SpawnRemoteAddition);
    }

    //* LEGACY CODE
    // ? Obsolete
    // Last pathstep will become a container. Remaining pathsteps will become roads.
    public createBuildProjectContainerExpansionLegacy(path: PathStep[], projectType: BuildProjectEnum) {
        const containerLocation: PathStep | undefined = path.pop();
        if (containerLocation) {
            let buildOrders: BuildOrder[] = [this.createContainerBuildOrder(containerLocation)];
            this.fillPathWithRoads(path, buildOrders);
            this.pushBuildProjectToSpawn(buildOrders, projectType);
        }
    }

    // All pathsteps will become roads;
    public createBuildProjectHighway(path: PathStep[], projectType: BuildProjectEnum) {
        let buildOrders: BuildOrder[] = [];
        this.fillPathWithRoads(path, buildOrders);
        this.pushBuildProjectToSpawn(buildOrders, projectType);
    }

    private pushBuildProjectToSpawn(buildOrders: BuildOrder[], projectType: BuildProjectEnum) {
        let buildProject: BuildProject = {
            buildOrders: buildOrders,
            roomName: this.roomName,
            activeSites: 0,
            projectType: projectType
        };
        if (!this.spawn.room.memory.buildProjects) {
            this.spawn.room.memory.buildProjects = [buildProject];
        } else {
            this.spawn.room.memory.buildProjects.push(buildProject);
        }
    }

    private fillPathWithRoads(path: PathStep[], buildOrders: BuildOrder[]) {
        while (path.length > 1) {
            // Check if there already is a road at the location.
            if (this.needRoadBuild(path[path.length - 1])) {
                const roadPathStep = path.pop();
                if (roadPathStep) {
                    buildOrders.push(this.createRoadBuildOrder(roadPathStep));
                }
            } else {
                // Let it drop into the void.
                path.pop();
            }
        }
    }

    private createRoadBuildOrder(path: PathStep): BuildOrder {
        return { x: path.x, y: path.y, type: STRUCTURE_ROAD };
    }

    private createContainerBuildOrder(path: PathStep): BuildOrder {
        return { x: path.x, y: path.y, type: STRUCTURE_CONTAINER };
    }

    private createExtractorBuildOrder(path: PathStep): BuildOrder {
        return { x: path.x, y: path.y, type: STRUCTURE_EXTRACTOR };
    }

    private needRoadBuild(pathStep: PathStep | undefined): boolean {
        if (pathStep) {
            const presentObjects: Structure[] | null = this.room.lookForAt(LOOK_STRUCTURES, pathStep.x, pathStep.y);
            if (presentObjects) {
                for (const structure of presentObjects) {
                    if (
                        structure.structureType === STRUCTURE_ROAD ||
                        structure.structureType === STRUCTURE_CONTAINER ||
                        structure.structureType === STRUCTURE_LINK ||
                        structure.structureType === STRUCTURE_STORAGE ||
                        structure.structureType === STRUCTURE_TERMINAL ||
                        structure.structureType === STRUCTURE_TOWER ||
                        structure.structureType === STRUCTURE_WALL
                    ) {
                        return false;
                    }
                }
            } else {
                return true;
            }
            return true;
        }
        return false;
    }
}
