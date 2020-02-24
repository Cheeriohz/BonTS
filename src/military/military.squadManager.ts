import _ from "lodash";
import { SquadTypes } from "enums/enum.squads";
import { SKFarm } from "./squad.skFarm";

export class SquadManager {
    public manageSquads() {
        if (Memory.squads) {
            for (const squad of _.values(Memory.squads)) {
                if (squad.wellStaffed) {
                    switch (squad.type) {
                        case SquadTypes.SKFarm: {
                            const s: SKFarm = new SKFarm(squad);
                            s.manageSquad();
                        }
                    }
                } else {
                    this.checkStaffing(squad);
                }
            }
        }
    }

    private checkStaffing(squad: Squad) {
        if (squad.enlistees.length === 4) {
            squad.wellStaffed = true;
        } else if (squad.type === SquadTypes.SKFarm && squad.enlistees.length === 2) {
            squad.wellStaffed = true;
        }
    }
}
