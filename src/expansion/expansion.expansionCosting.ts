import _ from "lodash";
import { GeneralBuilding } from "building/base/building.general";
import { SourceMapGenerator } from "source-map";
import { chmodSync } from "fs";

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
        if (roomName === "E33S12") {
            console.log(`HI HO`);
            for (let y = 0; y < 50; y++) {
                let buffer: string = "";
                for (let x = 0; x < 50; x++) {
                    buffer += cm.get(x, y);
                }
                console.log(buffer);
            }
        }

        return cm;
    }

    private determineFullPath(completionRange: number): PathFinderPath | null {
        return PathFinder.search(
            this.origin,
            { pos: this.destination, range: completionRange },
			{ roomCallback: this.costMatrixCallbackRoomOptimality,
			  maxOps: 4000 }
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
            this.translateOneWay(rpPath, this.translatedPaths);
        }
        // console.log(JSON.stringify(this.translatedPaths));
    }

    private translatedPathsReverse() {
        let rpPath = _.reverse(this.fullPath!.path);
        if (rpPath) {
            this.translateOneWay(rpPath, this.translatedPathsReversed);
        }
        // console.log(JSON.stringify(this.translatedPathsReversed));
    }

    private translateOneWay(rpPath: RoomPosition[], translatedStorage: RoomPathCostingRetainer[]) {
        const groupedPaths = _.groupBy(rpPath, "roomName");
        for (const roomName in groupedPaths) {
            translatedStorage.push(this.mapRoomPath(roomName, groupedPaths[roomName]));
        }
        this.connectRoomPathsForTranslatedPath(translatedStorage);
    }

    private connectRoomPathsForTranslatedPath(translatedPaths: RoomPathCostingRetainer[]) {
        if (translatedPaths.length > 1) {
            for (let index = 0; index < translatedPaths.length - 1; index++) {
                const peekAheadIndex = index + 1;
                this.linkCrossRoom(translatedPaths[index], translatedPaths[peekAheadIndex]);
            }
        }
    }

    private linkCrossRoom(originRoom: RoomPathCostingRetainer, destinationRoom: RoomPathCostingRetainer) {
        /*
        (50, 25) | (0,24):(0,25):(0,26)      => +,+ : +,0 : +,-   |  1   1   1 |  |  1   0  -1 |
        (0, 25) | (50,24):(50,25):(50,26)    => -,+ : -,0 : -,-   | -1  -1  -1 |  |  1   0  -1 |
        (25, 50) | (24, 0):(25, 0):(26, 0)   => +,+ : 0,+ : -,+   |  1   0  -1 |  |  1   1   1 |
        (25, 0) | (24, 50):(25, 50):(26, 50) => +,- : 0,- : -,-   |  1   0  -1 |  | -1  -1  -1 |
        */
        // (48, 36)  (1, 35)
        let lastOriginPath = _.last(originRoom.path);
        let psuedoBorderPath: PathStep = {
            x: lastOriginPath!.x + lastOriginPath!.dx,
            y: lastOriginPath!.y + lastOriginPath!.dy,
            dx: 0,
            dy: 0,
            direction: 1
        };

        const firstDestinationPath = _.first(destinationRoom.path);
        if (psuedoBorderPath!.x === 49) {
            psuedoBorderPath!.dx = 1;
            psuedoBorderPath.x = 0;
        } else if (psuedoBorderPath!.x === 0) {
            psuedoBorderPath!.dx = -1;
            psuedoBorderPath.x = 49;
        } else {
            psuedoBorderPath!.dx = firstDestinationPath!.x - firstDestinationPath!.dx;
        }
        if (psuedoBorderPath!.y === 49) {
            psuedoBorderPath!.dy = 1;
            psuedoBorderPath!.y = 0;
        } else if (psuedoBorderPath!.y === 0) {
            psuedoBorderPath!.dy = -1;
            psuedoBorderPath!.y = 49;
        } else {
            psuedoBorderPath!.dy = firstDestinationPath!.y - firstDestinationPath!.dy;
        }
        psuedoBorderPath!.direction = this.getDirectionConstant(lastOriginPath!.dx, lastOriginPath!.dy);
        destinationRoom.path = _.concat([psuedoBorderPath], destinationRoom.path);
    }

    private mapRoomPath(roomName: string, positions: RoomPosition[]): RoomPathCostingRetainer {
        let lastPosition: RoomPosition = positions[0];
        let pathSteps: PathStep[] = new Array<PathStep>();
        for (const pos of _.slice(positions, 1)) {
            const dx: number = pos.x - lastPosition.x;
            const dy: number = pos.y - lastPosition.y;
            const ps: PathStep = {
                x: pos.x,
                y: pos.y,
                dx: dx,
                dy: dy,
                direction: this.getDirectionConstant(dx, dy)
            };
            pathSteps.push(ps);
            lastPosition = pos;
        }
        // Check to see if our final position is a border.
        const finalPosition: PathStep | undefined = _.last(pathSteps);
        if (finalPosition!.x === 0 || finalPosition!.y === 0 || finalPosition!.x === 49 || finalPosition!.y === 49) {
            _.remove(pathSteps, finalPosition);
        }
        return { roomName: roomName, path: pathSteps };
    }
}
