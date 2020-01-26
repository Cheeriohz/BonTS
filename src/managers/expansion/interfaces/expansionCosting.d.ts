interface RoomPathRetainer {
    path: PathStep[];
}

interface RoomPathCostingRetainer extends RoomPathRetainer {
    roomName: string;
}
