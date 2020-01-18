export class sourceSelector {

    public static harvestSourceSmart(creep: Creep) {
        const source: Source = creep.room.find(FIND_SOURCES)[sourceSelector.getSource(creep)];
        if (creep.harvest(source) == ERR_NOT_IN_RANGE)
            creep.moveTo(source, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
    }

    public static getSource(creep: Creep): number {
        let sourceMap = creep.room.memory.sourceMap
        //Check to see if our sourceMap has been initialized
        if (sourceMap == null) {
            sourceMap = [];
            for (const source in creep.room.find(FIND_SOURCES)) {
                sourceMap[source] = [];
            }
        }
        if (sourceMap.length == 1) {
            return 0;
        }
        let assignment: number = this.checkIfAssigned(sourceMap, creep.name);
        if (assignment == -1) {
            this.cleanTree(sourceMap);
            assignment = this.getAssignment(sourceMap, creep.room);
            let currentAssignments: string[] = sourceMap[assignment];
            currentAssignments.push(creep.name);
            creep.room.memory.sourceMap = sourceMap;
        }
        return assignment;
    }

    private static checkIfAssigned(sourceMap: string[][], assignee: string) {
        for (let i = 0; i < sourceMap.length; i++) {
            if (sourceMap[i].includes(assignee)) {
                return i;
            }
        }
        return -1;
    }

    private static getAssignment(sourceMap: string[][], room: Room) {
        let sourceRatings: sourceRating[] = [];
        for (let i = 0; i < sourceMap.length; i++) {
            sourceRatings.push(this.getRate(i, sourceMap[i].length, room))
        }
        sourceRatings.sort((a, b) => a.rate - b.rate);
        return sourceRatings[0].index;
    }

    public static externalClean(room: Room) {
        if (room.memory.sourceMap) {
            room.memory.sourceMap = this.cleanTree(room.memory.sourceMap);
        }
    }

    private static cleanTree(sourceMap: string[][]): string[][] {
        for (let i = 0; i < sourceMap.length; i++) {
            for (let index = 0; index < sourceMap[i].length; index++) {
                while (index < sourceMap[i].length && !(sourceMap[i][index] in Game.creeps)) {
                    sourceMap[i].splice(index, 1);
                }
            }
        }
        return sourceMap;
    }

    private static getRate(index: number, assigneeCount: number, room: Room) {
        const source = room.find(FIND_SOURCES)[index];
        if (source) {
            return new sourceRating(index, assigneeCount);
        }
        else {
            return new sourceRating(index, -assigneeCount);
        }
    }

}

class sourceRating {
    public constructor(index: number, rate: number) {
        this.index = index;
        this.rate = rate;
    }

    public index!: number;
    public rate!: number;
}
