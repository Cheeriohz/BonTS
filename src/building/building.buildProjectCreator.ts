import { BuildProjectEnum } from "./interfaces/building.enum";

export class buildProjectCreator {
    private spawn!: StructureSpawn;
    private room!: Room;

    constructor(room: Room, spawn: StructureSpawn) {
        this.room = room;
        this.spawn = spawn;
    }

    public passThroughCreate(buildOrders: BuildOrder[]) {
        this.pushBuildProjectToSpawn(buildOrders, BuildProjectEnum.PassThroughCreate);
    }

    public createBuildProjectSingleSite(pos: RoomPosition, structureType: BuildableStructureConstant) {
        const buildOrder = [{ x: pos.x, y: pos.y, type: structureType }];
        this.pushBuildProjectToSpawn(buildOrder, BuildProjectEnum.SingleConstructionSiteNoFollowUp);
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

    // Last pathstep will become a container. Remaining pathsteps will become roads.
    public createBuildProjectContainerExpansion(path: PathStep[], projectType: BuildProjectEnum) {
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
            roomName: this.room.name,
            activeSites: 0,
            projectType: projectType
        };
        if (!this.spawn.memory.buildProjects) {
            this.spawn.memory.buildProjects = [buildProject];
        } else {
            this.spawn.memory.buildProjects.push(buildProject);
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
