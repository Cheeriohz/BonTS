interface Scouting {
    roomScouts: RoomScouts;
}

interface RoomScouts {
    [roomName: string]: RoomScout;
}

interface RoomScout {
    roomName: string;
    distance: number;
    mineral?: Id<Mineral>;
    deposit?: Id<Deposit>;
    sourceA?: Id<Source>;
    sourceB?: Id<Source>;
    threatAssessment?: number;
}
