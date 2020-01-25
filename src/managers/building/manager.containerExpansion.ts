import _ from "lodash";
import { Visualizer } from "./manager.visualizer";
import { BuildProjectEnum } from "./interfaces/building.enum";

export class ContainerExpansion {
    private spawn!: StructureSpawn;
    private room!: Room;
    private originPos!: RoomPosition;
    private visualizeOnly!: boolean;

    constructor(spawn: StructureSpawn, room: Room, originPos: RoomPosition, visualizeOnly: boolean) {
        this.spawn = spawn;
        this.room = room;
        this.originPos = originPos;
        this.visualizeOnly = visualizeOnly;
    }

    public checkForSourceExpansion(sources: Source[]): void {
        const sourcePositions: RoomPosition[] | null = this.identifySourcesWithoutContainer(sources);
        if (sourcePositions) {
            this.identifyExpansionTarget(sourcePositions, BuildProjectEnum.LocalContainerExpansion);
        }
        else {
            return;
        }
    }

    public checkForMineralExpansion() {
        const mineralPositions: RoomPosition[] | null = this.identifyMineralsWithoutContainer();
        if (mineralPositions) {
            this.identifyExpansionTarget(mineralPositions, BuildProjectEnum.LocalMineralExpansion);
        }
        else {
            return;
        }
    }

    private identifySourcesWithoutContainer(sources: Source[]): RoomPosition[] | null {
        if (this.room.memory.containerMap) {
            if (this.room.memory.containerMap.length > 1) {
                for (const containerAssignment of this.room.memory.containerMap) {
                    const container: StructureContainer | null = Game.getObjectById(containerAssignment.id);
                    if (container) {
                        const nearbySources: Source[] | null = container.pos.findInRange(sources, 3);
                        if (nearbySources) {
                            if (nearbySources.length > 0) {
                                sources = _.difference(sources, nearbySources);
                            }
                        }
                    }
                }
            }
        }
        if (sources.length > 0) {
            return _.map(sources, (s) => { return s.pos; });
        }
        return null;
    }

    private identifyMineralsWithoutContainer(): RoomPosition[] | null {
        const minerals: Mineral[] | null = this.room.find(FIND_MINERALS);
        let unTappedMinerals: Mineral[] = [];
        if (minerals) {
            for (const mineral of minerals) {
                const nearbyContainer: Structure[] | null = mineral.pos.findInRange(FIND_STRUCTURES, 3, {
                    filter: (s) => { return (s.structureType == STRUCTURE_CONTAINER); }
                });
                if (nearbyContainer.length === 0) {
                    unTappedMinerals.push(mineral);
                }
            }
        }
        if (unTappedMinerals.length > 0) {
            return _.map(unTappedMinerals, (m) => { return m.pos; });
        }
        return null;
    }

    private identifyExpansionTarget(positions: RoomPosition[], projectType: BuildProjectEnum) {
        const closest: RoomPosition | null = this.originPos.findClosestByRange(positions);
        if (closest) {
            const path: PathStep[] = this.originPos.findPathTo(closest, { ignoreCreeps: true });
            if (this.visualizeOnly) {
                this.visualizeContainerExpansion(path);
            }
            else {
                this.createBuildOrder(path, projectType);
            }
        }
    }

    private createBuildOrder(path: PathStep[], projectType: BuildProjectEnum) {
        const extractorLocation: PathStep | undefined = path.pop();
        if (extractorLocation) {
            let buildOrders: BuildOrder[] = [this.createExtractorBuildOrder(extractorLocation)];
            const containerLocation: PathStep | undefined = path.pop();
            if (containerLocation) {
                buildOrders.push(this.createContainerBuildOrder(containerLocation));
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

    private visualizeContainerExpansion(path: PathStep[]) {
        const visualizer: Visualizer = new Visualizer();
        visualizer.visualizeRoadInRoom(this.room.name, path);
    }

    private highlightContainerLocation(destination: RoomPosition) {
        const visualizer: Visualizer = new Visualizer();
        visualizer.visualizeTargetCallout(this.room.name, this.originPos, destination);
    }
}
