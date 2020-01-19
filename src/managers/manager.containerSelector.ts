import _ from "lodash";

export namespace containerSelector {

    export function withdraw(creep: Creep) {
        const container = Game.getObjectById<StructureContainer>(getContainer(creep));
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(container, { reusePath: 20, visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }

    export function getContainer(creep: Creep): string {
        let containerMap = creep.room.memory.containerMap
        //Check to see if our containerMap has been initialized
        if (containerMap == null) {
            containerMap = [];
            for (const container in findContainers(creep.room)) {
                containerMap[container] = [];
            }
        }
        if (containerMap.length == 1) {
            creep.room.memory.containerMap = containerMap;
            return findContainers(creep.room)[0].id;
        }
        let assignment: number = checkIfAssigned(containerMap, creep.name);
        if (assignment == -1) {
            cleanTree(containerMap);
            assignment = getAssignment(containerMap, creep.room, creep.memory.role);
            let currentAssignments: string[] = containerMap[assignment];
            currentAssignments.push(creep.name);
            creep.room.memory.containerMap = containerMap;
        }
        return findContainers(creep.room)[assignment].id;
    }

    function findContainers(room: Room): StructureContainer[] {
        return room.find<StructureContainer>(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTAINER)
            }
        });
    }

    function checkIfAssigned(containerMap: string[][], assignee: string) {
        for (let i = 0; i < containerMap.length; i++) {
            if (containerMap[i].includes(assignee)) {
                return i;
            }
        }
        return -1;
    }

    function getAssignment(containerMap: string[][], room: Room, role: number) {
        let containerRatings: sourceRating[] = [];
        for (let i = 0; i < containerMap.length; i++) {
            containerRatings.push(
                getRate(i,
                    _.filter(containerMap[i], function (creepName) { return Game.creeps[creepName].memory.role == role; }).length,
                    room));
        }
        containerRatings.sort((a, b) => a.rate - b.rate);
        return containerRatings[0].index;
    }

    export function externalClean(room: Room) {
        if (room.memory.containerMap) {
            room.memory.containerMap = cleanTree(room.memory.containerMap);
        }
    }

    function cleanTree(containerMap: string[][]): string[][] {
        for (let i = 0; i < containerMap.length; i++) {
            for (let index = 0; index < containerMap[i].length; index++) {
                while (index < containerMap[i].length && !(containerMap[i][index] in Game.creeps)) {
                    containerMap[i].splice(index, 1);
                }
            }
        }
        return containerMap;
    }

    function getRate(index: number, assigneeCount: number, room: Room) {
        return new sourceRating(index, assigneeCount);
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
