export class GeneralBuilding {
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
}
