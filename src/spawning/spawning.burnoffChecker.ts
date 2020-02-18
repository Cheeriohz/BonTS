import _ from "lodash";

import { CreepRole } from "enums/enum.roles";

export class BurnoffChecker {
    private room!: Room;
    private burnoffThreshold: number = 500000;

    constructor(room: Room) {
        this.room = room;
    }
}
