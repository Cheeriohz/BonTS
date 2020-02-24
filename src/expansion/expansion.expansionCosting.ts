import _ from "lodash";
import { GeneralBuilding } from "building/base/building.general";

export class ExpansionCosting extends GeneralBuilding {
    private origin!: RoomPosition;
    private destination!: RoomPosition;
    public destinationId!: string;
    public translatedPaths: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
    public translatedPathsReversed: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
    private fullPath!: PathFinderPath | null;
    public cost: number = Number.MAX_VALUE;

    constructor(origin: RoomPosition, destination: RoomPosition, destinationId: string, completionRange: number) {
        super();
        this.origin = origin;
        this.destination = destination;
        this.destinationId = destinationId;
        this.fullPath = this.determineFullPath(completionRange);
        if (this.fullPath) {
            this.cost = this.fullPath.cost;
            console.log(JSON.stringify(this.fullPath.path));
        } else {
            console.log(`Optimality didn't work out`);
        }
    }

    public getDestinationRoomName(): string {
        return this.destination.roomName;
    }

    public costMatrixCallbackRoomEligibility(roomName: string): boolean {
        const roomScout: RoomScout = Memory.scouting!.roomScouts[roomName];
        if (roomScout && roomScout.threatAssessment && roomScout.threatAssessment > 0) {
            return false;
        }
        return true;
    }

    public costMatrixCallbackRoomOptimality(roomName: string): CostMatrix | boolean {
        const roomScout: RoomScout = Memory.scouting!.roomScouts[roomName];
        if (roomScout && roomScout.threatAssessment && roomScout.threatAssessment > 0) {
            return false;
        }
        const cm: CostMatrix = new PathFinder.CostMatrix();
        const rt: RoomTerrain = Game.map.getRoomTerrain(roomName);
        for (let x = 0; x <= 49; x++) {
            for (let y = 0; y <= 49; y++) {
                switch (rt.get(x, y)) {
                    case TERRAIN_MASK_WALL:
                        cm.set(x, y, 255);
                        break;
                    case TERRAIN_MASK_SWAMP:
                        cm.set(x, y, 4);
                        break;
                    case 0:
                        cm.set(x, y, 3);
                        break;
                }
            }
        }
        const room = Game.rooms[roomName];
        if (room) {
            const roads = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_ROAD });
            for (const road of roads) {
                cm.set(road.pos.x, road.pos.y, 1);
            }
        }

        return cm;
    }

    private determineFullPath(completionRange: number): PathFinderPath | null {
        return PathFinder.search(
            this.origin,
            { pos: this.destination, range: completionRange },
            { roomCallback: this.costMatrixCallbackRoomOptimality, maxOps: 4000 }
        );
    }

    public translateFullPathToRetainableRoomPaths() {
        if (!this.fullPath!.incomplete) {
            this.translatePathsForward();
            this.translatedPathsReverse();
        }
    }

    private translatePathsForward() {
        let rpPath = this.fullPath!.path;
        if (rpPath) {
            GeneralBuilding.translateOneWay(rpPath, this.translatedPaths);
        }
        // console.log(JSON.stringify(this.translatedPaths));
    }

    private translatedPathsReverse() {
        let rpPath = _.reverse(this.fullPath!.path);
        if (rpPath) {
            GeneralBuilding.translateOneWay(rpPath, this.translatedPathsReversed);
        }
        // console.log(JSON.stringify(this.translatedPathsReversed));
    }
}
