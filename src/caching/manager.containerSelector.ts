import _ from "lodash";

export function getContainer(creep: Creep): string | null {
    let containerMap = creep.room.memory.containerMap;
    // Check to see if our containerMap has been initialized
    if (!containerMap || containerMap.length == 0) {
        containerMap = buildEmptyContainerMap(containerMap, creep.room);
    }
    if (containerMap.length === 0) {
        return "";
    }
    if (containerMap.length === 1) {
        creep.room.memory.containerMap = containerMap;
        return containerMap[0].id;
    }
    const assignment: string | null = checkIfAssigned(containerMap, creep.name);
    if (!assignment) {
        cleanTree(containerMap);
        const mapIndex: number = getAssignment(containerMap, creep.memory.role);
        containerMap[mapIndex].assigned.push(creep.name);
        creep.room.memory.containerMap = containerMap;
        return containerMap[mapIndex].id;
    } else {
        return assignment;
    }
}

export function buildEmptyContainerMap(containerMap: Assignment[] | null, room: Room) {
    containerMap = [];
    for (const container of findContainers(room)) {
        containerMap.push({ id: container.id, assigned: [] });
    }
    room.memory.containerMap = containerMap;
    return containerMap;
}

function findContainers(room: Room): StructureContainer[] {
    const allContainers: StructureContainer[] | null = room.find<StructureContainer>(FIND_STRUCTURES, {
        filter: structure => {
            return structure.structureType === STRUCTURE_CONTAINER;
        }
    });
    if (allContainers) {
        // Need to figure out which containers are source containers.
        return _.filter(allContainers, c => checkForSource(c));
    } else {
        return [];
    }
}

function checkForSource(container: StructureContainer): boolean {
    if (container.pos.findInRange(FIND_SOURCES, 3)?.length > 0) {
        return true;
    } else {
        return false;
    }
}

function checkIfAssigned(containerMap: Assignment[], assignee: string): string | null {
    for (let i = 0; i < containerMap.length; i++) {
        if (containerMap[i].assigned.includes(assignee)) {
            return containerMap[i].id;
        }
    }
    return null;
}

function getAssignment(containerMap: Assignment[], role: number) {
    const containerRatings: ContainerRating[] = [];
    for (let i = 0; i < containerMap.length; i++) {
        containerRatings.push(
            getRate(
                i,
                _.filter(containerMap[i].assigned, creepName => Game.creeps[creepName].memory.role === role).length
            )
        );
    }
    containerRatings.sort((a, b) => a.rate - b.rate);
    return containerRatings[0].index;
}

export function pruneContainerTree(room: Room) {
    if (room.memory.containerMap) {
        if (_.keys(room.memory.containerMap).length > 0) {
            room.memory.containerMap = cleanTree(room.memory.containerMap);
        }
    }
}

function cleanTree(containerMap: Assignment[]): Assignment[] {
    for (let i = 0; i < containerMap.length; i++) {
        for (let index = 0; index < containerMap[i].assigned?.length; index++) {
            while (index < containerMap[i].assigned?.length && !(containerMap[i].assigned[index] in Game.creeps)) {
                containerMap[i].assigned.splice(index, 1);
            }
        }
    }
    return containerMap;
}

export function refreshTree(room: Room, missingContainer: string) {
    if (room.memory.containerMap) {
        _.remove(room.memory.containerMap, cm => {
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
    return new ContainerRating(index, assigneeCount);
}

class ContainerRating {
    public constructor(index: number, rate: number) {
        this.index = index;
        this.rate = rate;
    }

    public index!: number;
    public rate!: number;
}
