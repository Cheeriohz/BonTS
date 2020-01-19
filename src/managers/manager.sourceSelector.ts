
export function harvestSourceSmart(creep: Creep) {
    const source: Source = creep.room.find(FIND_SOURCES)[getSource(creep)];
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
    }
}

export function getSource(creep: Creep): number {
    let sourceMap = creep.room.memory.sourceMap
    // Check to see if our sourceMap has been initialized
    if (sourceMap === null) {
        sourceMap = [];
        for (const source in creep.room.find(FIND_SOURCES)) {
            sourceMap[source] = [];
        }
    }
    if (sourceMap.length === 1) {
        return 0;
    }
    let assignment: number = checkIfAssigned(sourceMap, creep.name);
    if (assignment === -1) {
        cleanTree(sourceMap);
        assignment = getAssignment(sourceMap, creep.room);
        const currentAssignments: string[] = sourceMap[assignment];
        currentAssignments.push(creep.name);
        creep.room.memory.sourceMap = sourceMap;
    }
    return assignment;
}

function checkIfAssigned(sourceMap: string[][], assignee: string) {
    for (let i = 0; i < sourceMap.length; i++) {
        if (sourceMap[i].includes(assignee)) {
            return i;
        }
    }
    return -1;
}

function getAssignment(sourceMap: string[][], room: Room) {
    const sourceRatings: SourceRating[] = [];
    for (let i = 0; i < sourceMap.length; i++) {
        sourceRatings.push(getRate(i, sourceMap[i].length, room))
    }
    sourceRatings.sort((a, b) => a.rate - b.rate);
    return sourceRatings[0].index;
}

export function pruneSourceTree(room: Room) {
    if (room.memory.sourceMap) {
        room.memory.sourceMap = cleanTree(room.memory.sourceMap);
    }
}

function cleanTree(sourceMap: string[][]): string[][] {
    for (let i = 0; i < sourceMap.length; i++) {
        for (let index = 0; index < sourceMap[i].length; index++) {
            while (index < sourceMap[i].length && !(sourceMap[i][index] in Game.creeps)) {
                sourceMap[i].splice(index, 1);
            }
        }
    }
    return sourceMap;
}

function getRate(index: number, assigneeCount: number, room: Room) {
    const source = room.find(FIND_SOURCES)[index];
    if (source) {
        return new SourceRating(index, assigneeCount);
    }
    else {
        return new SourceRating(index, -assigneeCount);
    }
}



class SourceRating {
    public constructor(index: number, rate: number) {
        index = index;
        rate = rate;
    }

    public index!: number;
    public rate!: number;
}
