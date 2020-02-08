export class ThreatAssessing {
    public static ScoutAssessThreat(room: Room, roomScout: RoomScout) {
        // TODO make this more robust
        const creeps = room.find(FIND_HOSTILE_CREEPS);
        if (creeps && creeps.length > 0) {
            roomScout.threatAssessment = ThreatAssessment.rival;
            return;
        }
        const structures = room.find(FIND_HOSTILE_STRUCTURES);
        if (structures && structures.length > 0) {
            roomScout.threatAssessment = ThreatAssessment.trivial;
            return;
        }
    }
}

export enum ThreatAssessment {
    trivial = 0,
    rival = 1,
    danger = 2
}
