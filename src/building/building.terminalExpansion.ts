import _ from "lodash";
import { buildProjectCreator } from "./building.buildProjectCreator";

export class TerminalExpansion {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public enqueueTerminalProject(): boolean {
        const storage = this.spawn.room.storage;
        if (storage) {
            const optimalTerminalPosition = this.determineOptimalNeighbor(storage.pos);
            if (optimalTerminalPosition) {
                this.createBuildProject(optimalTerminalPosition);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private determineOptimalNeighbor(pos: RoomPosition): RoomPosition | null {
        const allRoadPositions = this.collectRoads(pos);
        if (allRoadPositions) {
            const neighbors = this.collectNeighbors(pos);
            if (neighbors) {
                const badNeighbors = this.collectBadNeighbors(pos);
                const optimalNeighbor = this.compete(neighbors, allRoadPositions, badNeighbors);
                if (optimalNeighbor) {
                    return optimalNeighbor;
                }
            }
        } else {
            console.log("Why on earth did we build a storage with no access?");
        }
        return null;
    }

    private createBuildProject(pos: RoomPosition) {
        const bpc: buildProjectCreator = new buildProjectCreator(this.spawn.room, this.spawn);
        bpc.createBuildProjectSingleSite(pos, STRUCTURE_TERMINAL);
        return;
    }

    private collectRoads(pos: RoomPosition): RoomPosition[] | null {
        let allRoads = pos.findInRange(FIND_STRUCTURES, 2, {
            filter: s => {
                return s.structureType === STRUCTURE_ROAD;
            }
        });
        if (allRoads.length > 0) {
            return _.map(allRoads, r => r.pos);
        } else {
            return null;
        }
    }

    private collectBadNeighbors(pos: RoomPosition): RoomPosition[] {
        let badNeighbors = pos.findInRange(FIND_STRUCTURES, 3, {
            filter: s => {
                return this.doesStructureDisqualify(s);
            }
        });
        if (badNeighbors.length > 0) {
            return _.map(badNeighbors, r => r.pos);
        } else {
            return [];
        }
    }

    private collectNeighbors(pos: RoomPosition): RoomPosition[] | null {
        let validPositions: RoomPosition[] = [];
        for (let x = -1; x < 2; x++) {
            for (let y = -1; y < 2; y++) {
                if (x != 0 || y != 0) {
                    const neighbor: RoomPosition = new RoomPosition(pos.x + x, pos.y + y, pos.roomName);
                    const disqualifyingStructure: Structure | undefined = neighbor
                        .lookFor(LOOK_STRUCTURES)
                        .find(s => this.doesStructureDisqualify(s));
                    if (!disqualifyingStructure) {
                        validPositions.push(neighbor);
                    }
                }
            }
        }
        if (validPositions.length > 0) {
            return validPositions;
        } else {
            return null;
        }
    }

    private doesStructureDisqualify(s: Structure): boolean {
        return (
            s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_TOWER ||
            s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_FACTORY ||
            s.structureType === STRUCTURE_LINK ||
            s.structureType === STRUCTURE_LAB ||
            s.structureType === STRUCTURE_CONTAINER ||
            s.structureType === STRUCTURE_CONTROLLER
        );
    }

    private compete(competitors: RoomPosition[], roads: RoomPosition[], badNeighbors: RoomPosition[]) {
        return _.last(
            _.sortBy(competitors, c => {
                return c.findInRange(roads, 1).length - c.findInRange(badNeighbors, 1).length;
            })
        );
    }
}
