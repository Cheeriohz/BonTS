export class ThreatAssessing {
    public static ScoutAssessThreat(room: Room, roomScout: RoomScout) {
        // TODO make this more robust
        const SKLairs = room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_KEEPER_LAIR
        });
        if (SKLairs) {
            roomScout.threatAssessment = ThreatAssessment.skLair;
        }
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
    danger = 2,
    skLair = 3
}
