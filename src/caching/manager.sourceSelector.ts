import _ from "lodash";

export function harvestSourceSmart(creep: Creep) {
    const sourceName = getSource(creep);
    if (sourceName) {
        const source: Source | null = Game.getObjectById(sourceName);
        if (source) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { reusePath: 5, visualizePathStyle: { stroke: "#ffaa00" } });
            }
        }
    }
}

export function getSource(creep: Creep): string | null {
    let sourceMap = creep.room.memory.sourceMap;
    // Check to see if our sourceMap has been initialized
    if (!sourceMap?.length) {
        sourceMap = [];
        GetSources(creep.room, sourceMap);
    }
    if (sourceMap.length === 1) {
        return sourceMap[0].id;
    }
    let assignment: string | null = checkIfAssigned(sourceMap, creep.name);
    if (!assignment) {
        cleanTree(sourceMap);
        const index = getAssignment(sourceMap, creep.room);
        if (sourceMap[index]?.assigned) {
            let currentAssignments: string[] = sourceMap[index].assigned;
            currentAssignments.push(creep.name);
            creep.room.memory.sourceMap = sourceMap;
        } else {
            sourceMap[index].assigned = [`${creep.name}`];
            creep.room.memory.sourceMap = sourceMap;
        }
        return sourceMap[index].id;
    } else {
        return assignment;
    }
}

export function GetSources(room: Room, sourceMap: Assignment[]) {
    const sources: Source[] | null = room.find(FIND_SOURCES);
    if (sources) {
        for (const index in sources) {
            sourceMap[index] = { id: sources[index].id, assigned: [] };
        }
    }
}

function checkIfAssigned(sourceMap: Assignment[], assignee: string): string | null {
    for (let i = 0; i < sourceMap.length; i++) {
        if (sourceMap[i].assigned?.includes(assignee)) {
            return sourceMap[i].id;
        }
    }
    return null;
}

function getAssignment(sourceMap: Assignment[], room: Room) {
    const sourceRatings: SourceRating[] = [];
    // console.log(sourceMap.length);
    if (!sourceMap) {
        return 0;
    }
    if (sourceMap.length == 0) {
        return 0;
    }
    for (let i = 0; i < sourceMap.length; i++) {
        if (sourceMap[i]?.assigned) {
            if (sourceMap[i].assigned.length > 0) {
                sourceRatings.push({ index: i, rate: sourceMap[i].assigned.length });
            } else {
                sourceRatings.push({ index: i, rate: 0 });
            }
        } else {
            sourceRatings.push({ index: i, rate: 0 });
        }
    }
    sourceRatings.sort((a, b) => a.rate - b.rate);
    return sourceRatings[0].index;
}

export function pruneSourceTree(room: Room) {
    if (room.memory.sourceMap) {
        if (_.keys(room.memory.sourceMap).length > 0) {
            room.memory.sourceMap = cleanTree(room.memory.sourceMap);
        }
    }
}

function cleanTree(sourceMap: Assignment[]): Assignment[] {
    for (let i = 0; i < sourceMap.length; i++) {
        for (let index = 0; index < sourceMap[i].assigned.length; index++) {
            while (index < sourceMap[i].assigned.length && !(sourceMap[i].assigned[index] in Game.creeps)) {
                sourceMap[i].assigned.splice(index, 1);
            }
        }
    }
    return sourceMap;
}

// function getRate(index: number, assigneeCount: number, room: Room) {
//     const source = room.find(FIND_SOURCES)[index];
//     console.log(`index: ${index} assignee: ${assigneeCount} room: ${room}`)
//     if (source) {
//         return new SourceRating(index, assigneeCount);
//     }
//     else {
//         return new SourceRating(index, -assigneeCount);
//     }
// }

class SourceRating {
    public constructor(index: number, rate: number) {
        this.index = index;
        this.rate = rate;
    }

    public index!: number;
    public rate!: number;
}
