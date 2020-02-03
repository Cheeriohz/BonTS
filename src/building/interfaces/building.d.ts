interface BuildProject {
    buildOrders: BuildOrder[];
    roomName: string;
    activeSites: number;
    projectType: number;
}

interface BuildOrder {
    x: number;
    y: number;
    type: BuildableStructureConstant;
}

interface NeighboringPositions {
    pos: RoomPosition;
    neighbors: RoomPosition[];
}
