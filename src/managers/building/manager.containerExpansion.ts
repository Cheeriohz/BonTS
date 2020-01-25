import _ from "lodash";
import { RoleDropper } from "roleDefinitions/role.dropper";
import { Visualizer } from "./manager.visualizer";

export class ContainerExpansion {
    private room!: Room;
    private originPos!: RoomPosition;
    private visualizeOnly!: boolean;

    constructor(room: Room, originPos: RoomPosition, visualizeOnly: boolean) {
        this.room = room;
        this.originPos = originPos;
        this.visualizeOnly = visualizeOnly;
    }

    public checkForSourceExpansion(sources: Source[]): void {
        const sourcePositions: RoomPosition[] | null = this.identifySourcesWithoutContainer(sources);
        if (sourcePositions) {
            this.identifyExpansionTarget(sourcePositions);
        }
        else {
            return;
        }
    }

    public checkForMineralExpansion() {
        const mineralPositions: RoomPosition[] | null = this.identifyMineralsWithoutContainer();
        if (mineralPositions) {
            this.identifyExpansionTarget(mineralPositions);
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
                if (!nearbyContainer) {
                    unTappedMinerals.push(mineral);
                }
            }
        }
        if (unTappedMinerals.length > 0) {
            return _.map(unTappedMinerals, (m) => { return m.pos; });
        }
        return null;
    }

    private identifyExpansionTarget(positions: RoomPosition[]) {
        const closest: RoomPosition | null = this.originPos.findClosestByRange(positions);
        if (closest) {
            //const path: PathStep[] = this.originPos.findPathTo(closest);
            if (this.visualizeOnly) {
                this.visualizeContainerExpansion(closest);
            }
        }
    }

    private visualizeContainerExpansion(destination: RoomPosition) {
        const visualizer: Visualizer = new Visualizer();
        visualizer.visualizeRoadInRoom(this.room.name, this.originPos, destination);
    }
}
