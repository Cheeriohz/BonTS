import _ from "lodash";
import { Visualizer } from "./building.visualizer";

export class GeneralBuilding {
    protected cardinalDirections = [TOP, RIGHT, BOTTOM, LEFT];
    protected cardinals: Array<[number, number]> = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
    ];

    protected calculateOrthogonalDistance(a: RoomPosition, b: RoomPosition): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    protected createExtensionBuildOrder(x: number, y: number): BuildOrder {
        return { x: x, y: y, type: STRUCTURE_EXTENSION };
    }

    protected createRoadBuildOrder(x: number, y: number): BuildOrder {
        return { x: x, y: y, type: STRUCTURE_ROAD };
    }

    // The x,y should be the top of the diamond
    protected buildRoadDiamond(x: number, y: number): BuildOrder[] {
        return [
            this.createRoadBuildOrder(x, y),
            this.createRoadBuildOrder(x + 1, y + 1),
            this.createRoadBuildOrder(x + 2, y + 2),
            this.createRoadBuildOrder(x + 1, y + 3),
            this.createRoadBuildOrder(x, y + 4),
            this.createRoadBuildOrder(x - 1, y + 3),
            this.createRoadBuildOrder(x - 2, y + 2),
            this.createRoadBuildOrder(x - 1, y + 1)
        ];
    }

    protected getDirectionConstant(dx: number, dy: number): DirectionConstant {
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
                        return TOP_LEFT;
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

    protected getRoomPositionForDirection(rp: RoomPosition, dc: DirectionConstant): RoomPosition | null {
        switch (dc) {
            case TOP: {
                return new RoomPosition(rp.x, rp.y - 1, rp.roomName);
            }
            case TOP_RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y - 1, rp.roomName);
            }
            case RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y, rp.roomName);
            }
            case BOTTOM_RIGHT: {
                return new RoomPosition(rp.x + 1, rp.y + 1, rp.roomName);
            }
            case BOTTOM: {
                return new RoomPosition(rp.x, rp.y + 1, rp.roomName);
            }
            case BOTTOM_LEFT: {
                return new RoomPosition(rp.x - 1, rp.y + 1, rp.roomName);
            }
            case LEFT: {
                return new RoomPosition(rp.x - 1, rp.y, rp.roomName);
            }
            case TOP_LEFT: {
                return new RoomPosition(rp.x - 1, rp.y - 1, rp.roomName);
            }
        }
    }

    protected directionClockwise(dc: DirectionConstant): DirectionConstant {
        if (dc !== TOP_LEFT) {
            return <DirectionConstant>(<number>dc + 1);
        } else {
            return TOP;
        }
    }

    protected directionCounterClockwise(dc: DirectionConstant): DirectionConstant {
        if (dc !== TOP) {
            return <DirectionConstant>(<number>dc - 1);
        } else {
            return TOP_LEFT;
        }
    }

    protected existingDisqualifyingStructure(x: number, y: number, room: Room): boolean {
        const structure = room.lookForAt(LOOK_STRUCTURES, x, y).find(s => this.doesStructureDisqualify(s));
        if (structure) {
            return true;
        } else {
            return false;
        }
    }

    protected doesStructureDisqualify(s: Structure): boolean {
        return (
            s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_TOWER ||
            s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_FACTORY ||
            s.structureType === STRUCTURE_LINK ||
            s.structureType === STRUCTURE_LAB ||
            s.structureType === STRUCTURE_CONTAINER ||
            s.structureType === STRUCTURE_CONTROLLER ||
            s.structureType === STRUCTURE_WALL ||
            s.structureType === STRUCTURE_ROAD
        );
    }

    protected visualizeBuild(buildOrders: BuildOrder[], roomName: string) {
        const rv: Visualizer = new Visualizer();
        rv.drawBuildOrders(buildOrders, roomName);
    }

    protected traverseDistanceTransformWithCheck(
        t: RoomPosition,
        serializedTransform: number[],
        threshold: number,
        serializedTransformCheck: number[],
        transformCheckThreshold: number
    ): RoomPosition | null {
        const transform: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransform);
        const transformCheck: CostMatrix = PathFinder.CostMatrix.deserialize(serializedTransformCheck);
        let m = 0;
        while (m < 25) {
            console.log(`attempting m:${m}`);
            if (transform.get(t.x + m, t.y + m) >= threshold) {
                if (transformCheck.get(t.x + m, t.y + m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x + m, t.y + m, t.roomName);
                }
            } else if (transform.get(t.x - m, t.y + m) >= threshold) {
                if (transformCheck.get(t.x - m, t.y + m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x - m, t.y + m, t.roomName);
                }
            } else if (transform.get(t.x + m, t.y - m) >= threshold) {
                if (transformCheck.get(t.x + m, t.y - m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x + m, t.y - m, t.roomName);
                }
            } else if (transform.get(t.x - m, t.y - m) >= threshold) {
                if (transformCheck.get(t.x - m, t.y - m) >= transformCheckThreshold) {
                    return new RoomPosition(t.x - m, t.y - m, t.roomName);
                }
            }
            m += 1;
        }
        return null;
    }

    protected traverseDistanceTransform(
        t: RoomPosition,
        transform: CostMatrix,
        threshold: number
    ): RoomPosition | null {
        let m = 0;
        while (m < 25) {
            if (transform.get(t.x + m, t.y + m) >= threshold) {
                return new RoomPosition(t.x + m, t.y + m, t.roomName);
            } else if (transform.get(t.x - m, t.y + m) >= threshold) {
                return new RoomPosition(t.x - m, t.y + m, t.roomName);
            } else if (transform.get(t.x + m, t.y - m) >= threshold) {
                return new RoomPosition(t.x + m, t.y - m, t.roomName);
            } else if (transform.get(t.x - m, t.y - m) >= threshold) {
                return new RoomPosition(t.x - m, t.y - m, t.roomName);
            }
            m += 1;
        }
        return null;
    }

    public distanceTransformRaw(roomName: string, logTransform: boolean) {
        let vis = new RoomVisual(roomName);
        const roomTerrain = Game.map.getRoomTerrain(roomName);

        let topDownPass = new PathFinder.CostMatrix();
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) {
                    topDownPass.set(x, y, 0);
                } else {
                    topDownPass.set(
                        x,
                        y,
                        Math.min(
                            topDownPass.get(x - 1, y - 1),
                            topDownPass.get(x, y - 1),
                            topDownPass.get(x + 1, y - 1),
                            topDownPass.get(x - 1, y)
                        ) + 1
                    );
                }
            }
        }

        for (let y = 49; y >= 0; --y) {
            for (let x = 49; x >= 0; --x) {
                let value = Math.min(
                    topDownPass.get(x, y),
                    topDownPass.get(x + 1, y + 1) + 1,
                    topDownPass.get(x, y + 1) + 1,
                    topDownPass.get(x - 1, y + 1) + 1,
                    topDownPass.get(x + 1, y) + 1
                );
                topDownPass.set(x, y, value);
                vis.circle(x, y, { radius: value / 25 });
            }
        }
        if (logTransform) {
            this.logDistanceTransform(topDownPass);
        }
        return topDownPass;
    }

    protected distanceTransformOccupied(roomName: string, existingStructures: RoomPosition[], logTransform: boolean) {
        let vis = new RoomVisual(roomName);
        const roomTerrain = Game.map.getRoomTerrain(roomName);

        let topDownPass = new PathFinder.CostMatrix();
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) {
                    topDownPass.set(x, y, 0);
                } else if (
                    _.find(existingStructures, es => {
                        return es.x === x && es.y === y;
                    })
                ) {
                    topDownPass.set(x, y, 0);
                } else {
                    topDownPass.set(
                        x,
                        y,
                        Math.min(
                            topDownPass.get(x - 1, y - 1),
                            topDownPass.get(x, y - 1),
                            topDownPass.get(x + 1, y - 1),
                            topDownPass.get(x - 1, y)
                        ) + 1
                    );
                }
            }
        }

        for (let y = 49; y >= 0; --y) {
            for (let x = 49; x >= 0; --x) {
                let value = Math.min(
                    topDownPass.get(x, y),
                    topDownPass.get(x + 1, y + 1) + 1,
                    topDownPass.get(x, y + 1) + 1,
                    topDownPass.get(x - 1, y + 1) + 1,
                    topDownPass.get(x + 1, y) + 1
                );
                topDownPass.set(x, y, value);
                vis.circle(x, y, { radius: value / 25 });
            }
        }
        if (logTransform) {
            this.logDistanceTransform(topDownPass);
        }
        return topDownPass;
    }

    private logDistanceTransform(matrix: CostMatrix) {
        for (let y = 0; y < 50; y++) {
            let buffer: string = "";
            for (let x = 0; x < 50; x++) {
                buffer += matrix.get(x, y);
            }
            console.log(buffer);
        }
    }
}
