import _ from "lodash";
import { GeneralBuilding } from "building/base/building.general";
import { Visualizer } from "building/building.visualizer";

export class BaseSquad extends GeneralBuilding {
    protected squadCreeps: Creep[] | null | undefined;

    protected handleSquadPath(squad: Squad) {
        const step = _.first(squad.path);
        if (step) {
            if (this.squadMove(squad, step.direction)) {
                squad.path = _.drop(squad.path);
            }
        }
        return true;
    }

    protected squadMove(squad: Squad, direction: DirectionConstant): boolean {
        if (!this.squadCreeps) {
            this.mapSquad(squad);
        }
        if (this.squadCreeps) {
            // Fatigue check
            for (const sm of this.squadCreeps) {
                if (sm.fatigue) {
                    return false;
                }
            }
            let even: boolean = true;
            for (let scIndex in this.squadCreeps) {
                if (even) {
                    this.squadCreeps[scIndex].move(direction);
                } else {
                    this.squadCreeps[scIndex].move(squad.cacheDirection!);
                }
                even = !even;
            }
        }

        this.updatePosition(direction, squad);
        return true;
    }

    protected updatePosition(direction: DirectionConstant, squad: Squad) {
        squad.cacheDirection = direction;
        switch (direction) {
            case TOP: {
                squad.pos[1] = squad.pos[1] - 1;
                if (squad.pos[1] === 0) {
                    squad.pos[1] = 49;
                }
                break;
            }
            case TOP_RIGHT: {
                squad.pos[0] = squad.pos[0] + 1;
                squad.pos[1] = squad.pos[1] - 1;
                if (squad.pos[1] === 0) {
                    squad.pos[1] = 49;
                }
                if (squad.pos[0] === 49) {
                    squad.pos[0] = 0;
                }
                break;
            }
            case RIGHT: {
                squad.pos[0] = squad.pos[0] + 1;
                if (squad.pos[0] === 49) {
                    squad.pos[0] = 0;
                }
                break;
            }
            case BOTTOM_RIGHT: {
                squad.pos[0] = squad.pos[0] + 1;
                squad.pos[1] = squad.pos[1] + 1;
                if (squad.pos[0] === 49) {
                    squad.pos[0] = 0;
                }
                if (squad.pos[1] === 49) {
                    squad.pos[1] = 0;
                }
                break;
            }
            case BOTTOM: {
                squad.pos[1] = squad.pos[1] + 1;
                if (squad.pos[1] === 49) {
                    squad.pos[1] = 0;
                }
                break;
            }
            case BOTTOM_LEFT: {
                squad.pos[0] = squad.pos[0] - 1;
                squad.pos[1] = squad.pos[1] + 1;
                if (squad.pos[0] === 0) {
                    squad.pos[0] = 49;
                }
                if (squad.pos[1] === 49) {
                    squad.pos[1] = 0;
                }
                break;
            }
            case LEFT: {
                squad.pos[0] = squad.pos[0] - 1;
                if (squad.pos[0] === 0) {
                    squad.pos[0] = 49;
                }
                break;
            }
            case TOP_LEFT: {
                squad.pos[0] = squad.pos[0] - 1;
                squad.pos[1] = squad.pos[1] - 1;
                if (squad.pos[0] === 0) {
                    squad.pos[0] = 49;
                }
                if (squad.pos[1] === 0) {
                    squad.pos[1] = 49;
                }
                break;
            }
        }
    }

    protected mapSquad(squad: Squad) {
        this.squadCreeps = _.compact(_.map(squad.enlistees, e => Game.creeps[e]));
    }

    //* Pathing
    // TODO   Add handling for poor corridor management
    protected squadPathQuad(
        squad: Squad,
        squadPosition: RoomPosition,
        target: Structure | Creep | PowerCreep,
        range?: number
    ) {
        squad.path = squadPosition.findPathTo(target.pos.x, target.pos.y, {
            range: range,
            costCallback: this.squadCostMatrixCallback
        });
        this.handleSquadPath(squad);
    }

    protected squadPathDuo(squad: Squad, squadPosition: RoomPosition, target: RoomPosition, range?: number) {
        squad.path = squadPosition.findPathTo(target.x, target.y, {
            range: range
        });
        this.handleSquadPath(squad);
    }

    // Should only need to be called when pulling a path out of cache.
    protected static migrateCachedPathToSquad(squad: Squad, path: PathStep[], reconcileDirection: DirectionConstant) {
        squad.cacheDirection = reconcileDirection;
        squad.path = path;
    }

    // protected oppositeDirection(direction: DirectionConstant): DirectionConstant {
    //     switch (direction) {
    //         case TOP: {
    //             return BOTTOM;
    //         }
    //         case TOP_RIGHT: {
    //             return BOTTOM_LEFT;
    //         }
    //         case TOP_LEFT: {
    //             return BOTTOM_RIGHT;
    //         }
    //         case RIGHT: {
    //             return LEFT;
    //         }
    //         case LEFT: {
    //             return RIGHT;
    //         }
    //         case BOTTOM: {
    //             return TOP;
    //         }
    //         case BOTTOM_LEFT: {
    //             return TOP_RIGHT;
    //         }
    //         case BOTTOM_RIGHT: {
    //             return TOP_LEFT;
    //         }
    //     }
    // }

    //* Distance Transform Callbacks
    private squadCostMatrixCallback(roomName: string, costMatrix: CostMatrix): CostMatrix | boolean {
        const room = Game.rooms[roomName];
        if (room) {
            if (room.memory.naturalDistanceTransform) {
                return BaseSquad.squadPostProcessDT(
                    PathFinder.CostMatrix.deserialize(room.memory.naturalDistanceTransform)
                );
            } else {
                const nDT = GeneralBuilding.distanceTransformRawManhattan(roomName, true);
                room.memory.naturalDistanceTransform = nDT.serialize();
                return BaseSquad.squadPostProcessDT(nDT);
            }
        }

        return BaseSquad.squadPostProcessDT(GeneralBuilding.distanceTransformRawManhattan(roomName, true));
    }

    private static squadPostProcessDT(cm: CostMatrix): CostMatrix {
        for (let y = 48; y >= 0; y--) {
            for (let x = 49; x >= 0; x--) {
                let value = cm.get(x, y);
                if (value == 1) {
                    cm.set(x, y, 255);
                }
            }
        }

        return cm;
    }
}
