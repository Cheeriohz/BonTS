import _ from "lodash";

export class BorderAggression {
    private spawn!: StructureSpawn;

    constructor(spawn: StructureSpawn) {
        this.spawn = spawn;
    }

    public HandleTrivialNeighbors() {
        if (Memory.scouting && Memory.scouting.roomScouts) {
            if (!this.spawn.memory.roomHarass) {
                this.spawn.memory.roomHarass = [];
            }
            for (const room of _.filter(_.values(Memory.scouting.roomScouts), rs => {
                return rs.distance < 2 && rs.threatAssessment === 0;
            })) {
                const roomHarass: RoomHarrass = {
                    roomName: room.roomName,
                    knights: null,
                    kHeal: 0,
                    kStrength: 0,
                    knightCap: 0,
                    archers: null,
                    aStrength: 1,
                    aHeal: 0,
                    archerCap: 2,
                    pauseToTime: 0,
                    distance: room.distance * 50,
                    downgrader: null,
                    dgStrength: 0,
                    reassign: false,
                    pathingLookup: {}
                };
                this.spawn.memory.roomHarass.push(roomHarass);
            }
        }
    }
}
