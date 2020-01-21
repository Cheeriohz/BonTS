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
        let orders = <ScoutOrder>creep.memory.orders;
        if (orders.roomPath.length > 0) {
            if (creep.room.name === orders.roomPath[0]) {
                // console.log(` ${creep.name}: Room Identified`);
                // We have entered the next room.
                if (orders.roomPath.length === 1) {
                    // console.log(`${creep.name}: Have traveled to room`);
                    // We have arrived at our destination.
                    orders.roomPath.pop();
                    if (!orders.independentOperator) {
                        this.report(creep, expeditionManager);
                    }
                    else {
                        expeditionManager.reassignmentRequest(creep);
                    }

                }
                else {
                    // console.log(` ${creep.name}: Need to travel`);
                    // Need to continue travelling.
                    orders.roomPath = _.takeRight(orders.roomPath, orders.roomPath.length - 1);
                    (<ScoutOrder>creep.memory.orders).roomPath = orders.roomPath;
                    this.travelToRoom(creep, orders.roomPath[0]);
                }
            }
            else {
                // We need to travel to the room.
                this.travelToRoom(creep, orders.roomPath[0]);
            }
        }
        else {
            expeditionManager.reassignmentRequest(creep);
        }
        //console.log(` ${creep.name}: I have embarked`);

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
            console.log(`Findings compiled ${JSON.stringify(findingsCompiled)}`);
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
