import _ from "lodash";

export class ExpansionCosting {
    private origin!: RoomPosition;
    private destination!: RoomPosition;
    public destinationId!: string;
    public translatedPaths: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
    public translatedPathsReversed: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
    private fullPath!: PathFinderPath | null;
    public cost: number = Number.MAX_VALUE;

    constructor(origin: RoomPosition, destination: RoomPosition, destinationId: string, completionRange: number) {
        this.origin = origin;
        this.destination = destination;
        this.destinationId = destinationId;
        this.fullPath = this.determineFullPath(completionRange);
        if (this.fullPath) {
            this.cost = this.fullPath.cost;
        }
    }

    private determineFullPath(completionRange: number): PathFinderPath | null {
        return PathFinder.search(this.origin, { pos: this.destination, range: completionRange });
    }

    public translateFullPathToRetainableRoomPaths() {
        if (!this.fullPath!.incomplete) {
            this.translatePathsForward();
            this.translatedPathsReverse();
        }
    }

    private translatePathsForward() {
        let rpPath = this.fullPath!.path
        if (rpPath) {
            this.translateOneWay(rpPath, this.translatedPaths);
        }
        console.log(JSON.stringify(this.translatedPaths));
    }

    private translatedPathsReverse() {
        let rpPath = _.reverse(this.fullPath!.path)
        if (rpPath) {
            this.translateOneWay(rpPath, this.translatedPathsReversed);
        }
        console.log(JSON.stringify(this.translatedPathsReversed));
    }


    private translateOneWay(rpPath: RoomPosition[], translatedStorage: RoomPathCostingRetainer[]) {
        const groupedPaths = _.groupBy(rpPath, 'roomName');
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
        let lastOriginPath = (_.last(originRoom.path));
        const firstDestinationPath = (_.first(destinationRoom.path));
        if (lastOriginPath!.x === 49) {
            lastOriginPath!.dx = 1;
        }
        else if (lastOriginPath!.x === 0) {
            lastOriginPath!.dx = -1;
        }
        else {
            lastOriginPath!.dx = (firstDestinationPath!.x - lastOriginPath!.x);
        }
        if (lastOriginPath!.y === 49) {
            lastOriginPath!.dy = 1;
        }
        else if (lastOriginPath!.y === 0) {
            lastOriginPath!.dy = -1;
        }
        else {
            lastOriginPath!.dy = (firstDestinationPath!.y - lastOriginPath!.y);
        }
        lastOriginPath!.direction = this.getDirectionConstant(lastOriginPath!.dx, lastOriginPath!.dy);
    }



    private mapRoomPath(roomName: string, positions: RoomPosition[]): RoomPathCostingRetainer {
        let lastPosition: RoomPosition = positions[0];
        let pathSteps: PathStep[] = new Array<PathStep>();
        for (const pos of _.slice(positions, 1)) {
            const dx: number = pos.x - lastPosition.x;
            const dy: number = pos.y - lastPosition.y;
            const ps: PathStep = {
                x: lastPosition.x,
                y: lastPosition.y,
                dx: dx,
                dy: dy,
                direction: this.getDirectionConstant(dx, dy)
            };
            pathSteps.push(ps);
            lastPosition = pos;
        }
        const finalPosition: RoomPosition | undefined = _.last(positions);
        if (finalPosition) {
            pathSteps.push({
                x: finalPosition.x,
                y: finalPosition.y,
                dx: 0,
                dy: 0,
                direction: TOP
            });
        }
        return { roomName: roomName, path: pathSteps };

    }

    private getDirectionConstant(dx: number, dy: number): DirectionConstant {
        switch (dx) {
            case 0: {
                switch (dy) {
                    case 1: {
                        return BOTTOM;
                    }
                    case -1: {
                        return TOP;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case 1: {
                switch (dy) {
                    case 0: {
                        return RIGHT;
                    }
                    case 1: {
                        return BOTTOM_RIGHT;
                    }
                    case -1: {
                        return TOP_RIGHT;
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            case -1: {
                switch (dy) {
                    case 0: {
                        return LEFT;
                    }
                    case 1: {
                        return BOTTOM_LEFT;
                    }
                    case -1: {
                        return TOP_LEFT
                    }
                    default: {
                        console.log("Error invalid dy for a pathstep");
                    }
                }
                break;
            }
            default: {
                console.log("Error invalid dx for a pathstep");
                break;
            }
        }
        throw `dx: ${dx}  dy: ${dy} was invalid`;
    }
}
