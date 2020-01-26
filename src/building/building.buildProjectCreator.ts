import { BuildProjectEnum } from "./interfaces/building.enum";

export class buildProjectCreator {
    private spawn!: StructureSpawn;
    private room!: Room;

    constructor(room: Room, spawn: StructureSpawn) {
        this.room = room;
        this.spawn = spawn;
    }

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

    public createBuildProjectLocalContainerExpansion(path: PathStep[], projectType: BuildProjectEnum) {
        const containerLocation: PathStep | undefined = path.pop();
        if (containerLocation) {
            let buildOrders: BuildOrder[] = [this.createContainerBuildOrder(containerLocation)];
            this.fillPathWithRoads(path, buildOrders);
            this.pushBuildProjectToSpawn(buildOrders, projectType);
        }
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
        }
        else {
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
            }
            else {
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
                    if (structure.structureType === STRUCTURE_ROAD) {
                        return false;
                    }
                }
            }
            else {
                return true;
            }
            return true;
        }
        return false;
    }
}
