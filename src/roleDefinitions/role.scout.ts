import { ExpeditionManager } from "expansion/manager.expedition";
import _ from "lodash";
import { RoleRemote } from "./base/role.remote";

export class RoleScout extends RoleRemote {
    public runExpeditionScout(creep: Creep, expeditionManager: ExpeditionManager) {
        if (!creep.memory.orders) {
            expeditionManager.reportForInitialAssignment(creep);
            // this.logOrders(creep);
        }
        if (creep.memory.working) {
            this.embark(creep, expeditionManager);
        }
    }

    private embark(creep: Creep, expeditionManager: ExpeditionManager) {
        let orders = <ScoutOrder>creep.memory.orders;
        if (orders?.target) {
            if (creep.room.name === orders.target) {
                if (creep.pos.isNearTo(25, 25)) {
                    if (!orders.independentOperator) {
                        this.report(creep, expeditionManager);
                    } else {
                        expeditionManager.reassignmentRequest(creep);
                    }
                } else {
                    creep.moveTo(25, 25, { reusePath: 1500, ignoreCreeps: true });
                }
            } else {
                this.travelToRoom(creep, orders.target, false);
            }
        } else {
            expeditionManager.reassignmentRequest(creep);
            // this.logOrders(creep);
        }
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
            // console.log(`Findings compiled ${JSON.stringify(findingsCompiled)}`);
            expeditionManager.reportFindings(creep, findingsCompiled);
        } else {
            expeditionManager.reportFindings(creep, []);
        }
    }

    private logOrders(creep: Creep) {
        // console.log(`Orders for ${creep.name} are: ${JSON.stringify(creep.memory.orders)}`);
    }
}
