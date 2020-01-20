import { ExpeditionManager } from "managers/manager.expedition";
import _ from "lodash";

export class RoleScout {

    public run(creep: Creep, expeditionManager: ExpeditionManager) {
        if (!creep.memory.orders) {
            expeditionManager.reportForInitialAssignment(creep);
            this.logOrders(creep);
        }
        if (creep.memory.working) {
            this.embark(creep, expeditionManager);
        }
    }

    private embark(creep: Creep, expeditionManager: ExpeditionManager) {
        let roomPath = (<ScoutOrder>creep.memory.orders).roomPath;
        if (creep.room.name === roomPath[0]) {
            console.log(` ${creep.name}: Room Identified`);
            // We have entered the next room.
            if (roomPath.length === 1) {
                // We have arrived at our destination.
                console.log(`${creep.name}: Have traveled to room`);
                this.report(creep, expeditionManager);
            }
            else {
                console.log(` ${creep.name}: Need to travel`);
                // Need to continue travelling.
                roomPath = _.takeRight(roomPath, roomPath.length - 1);
                (<ScoutOrder>creep.memory.orders).roomPath = roomPath;
                this.travelToRoom(creep, roomPath[0]);
            }
        }
        else {
            // We need to travel to the room.
            this.travelToRoom(creep, roomPath[0]);
        }
        console.log(` ${creep.name}: I have embarked`);

    }

    private report(creep: Creep, expeditionManager: ExpeditionManager) {
        // First scan the surroundings.
        const searchTarget = (<ScoutOrder>creep.memory.orders).searchTarget;
        const findings = creep.room.find(searchTarget);
        //console.log(`Findings are ${JSON.stringify(findings)}`);
        if (findings) {
            let findingsCompiled: string[] = [];
            for (const finding of findings) {
                findingsCompiled.push(_.get(finding, "id"));
            }
            //console.log(`Findings compiled ${JSON.stringify(findingsCompiled)}`);
            expeditionManager.reportFindings(creep, findingsCompiled);
        }
        else {
            expeditionManager.reportFindings(creep, []);
        }

    }

    private logOrders(creep: Creep) {
        console.log(`Orders for ${creep.name} are: ${JSON.stringify(creep.memory.orders)}`);
    }

    private travelToRoom(creep: Creep, roomName: string) {
        let target = Game.map.findExit(creep.room.name, roomName);
        if (target > 0) {
            const destination = creep.pos.findClosestByPath(<ExitConstant>target);
            if (destination) {
                creep.moveTo(destination, {
                    reusePath: 25
                });
            }
        }
    }



}
