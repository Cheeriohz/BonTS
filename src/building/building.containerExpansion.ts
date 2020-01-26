import _ from "lodash";
import { Visualizer } from "./building.visualizer";
import { BuildProjectEnum } from "./interfaces/building.enum";
import { buildProjectCreator } from "./building.buildProjectCreator";

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
                const bpc: buildProjectCreator = new buildProjectCreator(this.room, this.spawn);
                if (projectType === BuildProjectEnum.LocalMineralExpansion) {
                    bpc.createBuildProjectLocalMineExpansion(path, projectType);
                }
                else if (projectType === BuildProjectEnum.LocalContainerExpansion) {
                    bpc.createBuildProjectLocalContainerExpansion(path, projectType);
                }

            }
        }
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
