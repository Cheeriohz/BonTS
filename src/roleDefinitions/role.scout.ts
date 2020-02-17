import { ExpeditionManager } from "expansion/manager.expedition";
import _ from "lodash";
import { RoleRemote } from "./base/role.remote";
import { ThreatAssessing } from "military/military.threatAssessing";

export class RoleScout extends RoleRemote {
    public runExpeditionScout(creep: Creep, expeditionManager: ExpeditionManager) {
        if (!creep.memory.orders) {
            expeditionManager.reportForInitialAssignment(creep);
            // this.logOrders(creep);
        }
        if (creep.memory.working) {
            if (creep.memory.orders && creep.memory.orders.independentOperator) {
                this.scout(creep);
            } else {
                this.embark(creep, expeditionManager);
            }
        }
    }

    //* Independent Operations
    private scout(creep: Creep) {
        if (creep.memory.orders!.target === "") {
            const neighbors = Game.map.describeExits(creep.room.name);
            if (neighbors) {
                if (!this.chooseExit(neighbors, creep)) {
                    this.chooseExit(neighbors, creep, true);
                }
            }
        } else {
            this.scoutLocation(creep);
        }
    }

    private chooseExit(neighbors: Partial<Record<ExitKey, string>>, creep: Creep, ignoreRescout?: boolean) {
        const exits: ExitKey[] = ["1", "3", "5", "7"];
        for (const exit of _.shuffle(exits)) {
            const exitName = _.get(neighbors, exit);
            if (exitName) {
                if (
                    (ignoreRescout &&
                        Memory.scouting.roomScouts[exitName] &&
                        !Memory.scouting.roomScouts[exitName].threatAssessment) ||
                    !Memory.scouting.roomScouts[exitName]
                ) {
                    creep.memory.orders!.target = exitName;
                    switch (exit) {
                        case "1": {
                            const exitPos = creep.pos.findClosestByPath(FIND_EXIT_TOP);
                            if (exitPos) {
                                creep.memory.path = creep.pos.findPathTo(exitPos);
                                this.pathHandling(creep);
                                return true;
                            }
                        }
                        case "3": {
                            const exitPos = creep.pos.findClosestByPath(FIND_EXIT_RIGHT);
                            if (exitPos) {
                                creep.memory.path = creep.pos.findPathTo(exitPos);
                                this.pathHandling(creep);
                                return true;
                            }
                        }
                        case "5": {
                            const exitPos = creep.pos.findClosestByPath(FIND_EXIT_BOTTOM);
                            if (exitPos) {
                                creep.memory.path = creep.pos.findPathTo(exitPos);
                                this.pathHandling(creep);
                                return true;
                            }
                        }
                        case "7": {
                            const exitPos = creep.pos.findClosestByPath(FIND_EXIT_LEFT);
                            if (exitPos) {
                                creep.memory.path = creep.pos.findPathTo(exitPos);
                                this.pathHandling(creep);
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    private scoutLocation(creep: Creep) {
        if (creep.room.name === creep.memory.orders!.target) {
            if (this.leaveBorder(creep)) {
                // Report
                this.reportIndependentRoomScouting(creep);
            }
        } else {
            if (creep.memory.stuckCount != 5) {
                creep.memory.stuckCount = 5;
                this.leaveBorder(creep);
            } else {
                // Room is blocked.
                this.logRoomScout({ roomName: creep.memory.orders!.target, distance: 0 });
                creep.memory.orders!.target = "";
            }
        }
    }

    private reportIndependentRoomScouting(creep: Creep) {
        creep.memory.orders!.target = "";
        let roomScout = Memory.scouting.roomScouts[creep.room.name] ?? { roomName: creep.room.name, distance: 10000 };

        for (const spawn of _.uniqBy(_.values(Game.spawns), s => s.room.name)) {
            const distance = Game.map.getRoomLinearDistance(creep.room.name, spawn.room.name);
            console.log(`spawn: ${spawn.name} | distance : ${distance}`);
            if (roomScout.distance > distance) {
                roomScout.distance = distance;
                roomScout.closestRoom = spawn.room.name;
            }
        }

        this.roomScoutAddSources(creep.room, roomScout);
        this.roomScoutAddDeposit(creep.room, roomScout);
        this.roomScoutAddMineral(creep.room, roomScout);
        ThreatAssessing.ScoutAssessThreat(creep.room, roomScout);
        this.logRoomScout(roomScout);
        this.scout(creep);
    }

    private logRoomScout(roomScout: RoomScout) {
        console.log(`	${JSON.stringify(roomScout)}`);
        Memory.scouting.roomScouts[roomScout.roomName] = roomScout;
    }

    private roomScoutAddSources(room: Room, roomScout: RoomScout) {
        const sources = room.find(FIND_SOURCES);
        switch (sources.length) {
            case 0: {
                return;
            }
            case 1: {
                roomScout.sourceA = _.first(sources)!.id;
                return;
            }
            case 2: {
                roomScout.sourceA = _.first(sources)!.id;
                roomScout.sourceB = _.last(sources)!.id;
                return;
            }
        }
    }

    private roomScoutAddDeposit(room: Room, roomScout: RoomScout) {
        const deposits = room.find(FIND_DEPOSITS);
        if (deposits && deposits.length > 0) {
            roomScout.deposit = _.first(deposits)!.id;
        }
    }

    private roomScoutAddMineral(room: Room, roomScout: RoomScout) {
        const minerals = room.find(FIND_MINERALS);
        if (minerals && minerals.length > 0) {
            roomScout.mineral = _.first(minerals)!.id;
        }
    }

    //* Expedition Operations
    private embark(creep: Creep, expeditionManager: ExpeditionManager) {
        let orders = <ScoutOrder>creep.memory.orders;
        if (orders?.target) {
            if (creep.room.name === orders.target) {
                if (creep.pos.isNearTo(25, 25)) {
                    if (!orders.independentOperator) {
                        //this.leaveBorderPlus(creep);
                        //this.report(creep, expeditionManager);
                        creep.moveTo(25, 25, { reusePath: 1500, ignoreCreeps: true });
                    } else {
                        //this.leaveBorderPlus(creep);
                        creep.moveTo(25, 25, { reusePath: 1500, ignoreCreeps: true });
                        //expeditionManager.reassignmentRequest(creep);
                    }
                } else {
                    creep.moveTo(25, 25, { reusePath: 1500, ignoreCreeps: true });
                    //this.leaveBorder(creep);
                    //creep.moveTo(25, 25, { reusePath: 1500, ignoreCreeps: true });
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
}
