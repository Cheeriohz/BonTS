interface Theatre {
    type: number;
    roomName: string;
    rallyLocation: RoomPosition;
    squadActive: boolean;
    tick: number;
    currentSegment: number;
    deploymentPath?: PathStep[];
    culled?: boolean;
    patrolSegments?: Array<PathStep[]>;
}
