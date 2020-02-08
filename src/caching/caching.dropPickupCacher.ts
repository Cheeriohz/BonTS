import { CreepRole } from "enums/enum.roles";
import _ from "lodash";

export function getdropMapPosition(creep: Creep): { x: number; y: number } | null {
    let dropMap = creep.room.memory.dropMap;
    // Check to see if our dropMap has been initialized
    if (!dropMap || dropMap.length == 0) {
        dropMap = buildEmptydropMap(dropMap, creep.room);
    }
    if (dropMap.length === 0) {
        return null;
    }
    if (dropMap.length === 1) {
        creep.room.memory.dropMap = dropMap;
        const soleDrop = _.first(dropMap);
        return { x: soleDrop!.x, y: soleDrop!.y };
    }
    const assignment: { x: number; y: number } | null = checkIfAssigned(dropMap, creep.name);
    if (!assignment) {
        cleanTree(dropMap);
        const mapIndex: number = getAssignment(dropMap, creep.memory.role);
        dropMap[mapIndex].assigned.push(creep.name);
        creep.room.memory.dropMap = dropMap;
        return { x: dropMap[mapIndex].x, y: dropMap[mapIndex].y };
    } else {
        return assignment;
    }
}

export function buildEmptydropMap(dropMap: AssignmentPosition[] | null, room: Room) {
    dropMap = findSourceDropPickups(room);
    room.memory.dropMap = dropMap;
    return dropMap;
}

function findSourceDropPickups(room: Room): AssignmentPosition[] {
    const allPickups: AssignmentPosition[] = [];
    const sourceMap = room.memory.sourceMap;
    for (const sourceMapping of sourceMap) {
        if (sourceMapping.id) {
            const source: Source | null = Game.getObjectById(sourceMapping.id);
            if (source) {
                // Check for near dropper.
                determineDropPositionForRoomposition(source.pos, allPickups);
            }
        }
    }
    return allPickups;
}

function determineDropPositionForRoomposition(pos: RoomPosition, allPickups: AssignmentPosition[]) {
    const droppers: Creep[] | null = pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: c => {
            return c.memory.role === CreepRole.dropper;
        }
    });
    if (droppers && droppers.length > 0) {
        const dropper = _.first(droppers);
        allPickups.push({ id: dropper!.id, x: dropper!.pos.x, y: dropper!.pos.y, assigned: [] });
        return;
    } else {
        // check for nearby road
        const builtRoads: Structure[] | null = pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_ROAD
        });
        if (builtRoads && builtRoads.length > 0) {
            const road: Structure | undefined = _.first(builtRoads);
            allPickups.push({ id: null, x: road!.pos.x, y: road!.pos.y, assigned: [] });
            return;
        } else {
            // check for reserved road
            const room = Game.rooms[pos.roomName];
            if (room) {
                if (room.memory.reservedBuilds) {
                    const road = _.first(
                        _.filter(room.memory.reservedBuilds, b => {
                            return (
                                Math.abs(pos.x - b.x) <= 1 && Math.abs(pos.y - b.y) <= 1 && b.type === STRUCTURE_ROAD
                            );
                        })
                    );
                    if (road) {
                        allPickups.push({ id: null, x: road.x, y: road.y, assigned: [] });
                        return;
                    }
                } else {
                    // Might be worth checking build projects for the room. For now, just return the first step on the path to spawn.
                    if (room.memory.spawns && room.memory.spawns.length > 0) {
                        const spawnId = _.first(room.memory.spawns);
                        if (spawnId) {
                            const spawn = Game.getObjectById(spawnId);
                            const path = pos.findPathTo(spawn!.pos.x, spawn!.pos.y, {
                                ignoreCreeps: true,
                                swampCost: 1.001
                            });
                            if (path && path.length > 0) {
                                const dropPos = _.first(path);
                                allPickups.push({ id: null, x: dropPos!.x, y: dropPos!.y, assigned: [] });
                                return;
                            }
                        } else {
                            console.log(`Could not determine a drop positions for pos: ${pos}`);
                        }
                    }
                }
            } else {
                // Can't determine anything more without room vision. In theory this shouldn't happen.
                return;
            }
        }
    }
}

function checkIfAssigned(dropMap: AssignmentPosition[], assignee: string): { x: number; y: number } | null {
    for (let i = 0; i < dropMap.length; i++) {
        if (dropMap[i].assigned.includes(assignee)) {
            return { x: dropMap[i].x, y: dropMap[i].y };
        }
    }
    return null;
}

function getAssignment(dropMap: Assignment[], role: number) {
    const dropRatings: DropRating[] = [];
    for (let i = 0; i < dropMap.length; i++) {
        dropRatings.push(
            getRate(i, _.filter(dropMap[i].assigned, creepName => Game.creeps[creepName].memory.role === role).length)
        );
    }
    dropRatings.sort((a, b) => a.rate - b.rate);
    return dropRatings[0].index;
}

export function pruneDropTree(room: Room) {
    if (room.memory.dropMap) {
        if (_.keys(room.memory.dropMap).length > 0) {
            room.memory.dropMap = cleanTree(room.memory.dropMap);
        }
    }
}

function cleanTree(dropMap: AssignmentPosition[]): AssignmentPosition[] {
    for (let i = 0; i < dropMap.length; i++) {
        for (let index = 0; index < dropMap[i].assigned?.length; index++) {
            while (index < dropMap[i].assigned?.length && !(dropMap[i].assigned[index] in Game.creeps)) {
                dropMap[i].assigned.splice(index, 1);
            }
        }
    }
    return dropMap;
}

export function refreshTree(room: Room, missingContainer: string) {
    if (room.memory.dropMap) {
        _.remove(room.memory.dropMap, cm => {
            return cm.id === missingContainer;
        });

        const spawn = _.find(_.values(Game.spawns), s => {
            return s.room.name == room.name;
        });
        if (spawn) {
            spawn.memory.sourcesUtilized = false;
        }
    }
}

function getRate(index: number, assigneeCount: number) {
    return new DropRating(index, assigneeCount);
}

class DropRating {
    public constructor(index: number, rate: number) {
        this.index = index;
        this.rate = rate;
    }

    public index!: number;
    public rate!: number;
}
