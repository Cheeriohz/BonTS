import { BaseSquad } from "./base/squad.baseSquad";
import { RemoteHarvestHandler } from "remote/remote.remoteHarvestHandler";
import _ from "lodash";
import { GeneralBuilding } from "building/base/building.general";

export class SKFarm extends BaseSquad {
    private squad!: Squad;
    private theatre!: Theatre;

    constructor(squad: Squad) {
        super();
        this.squad = squad;
        this.theatre = Memory.theatres[this.squad.theatre];
        this.theatre.tick--;
    }

    public manageSquad() {
        this.mapSquad(this.squad);
        // TODO add early reset (set the theatre flag to inactive squad, but allow the squad to keep performing until death)

        if (this.squad.path && this.squad.path.length) {
            this.handleSquadPath(this.squad);
            return;
        }
        if (!this.squad.activeCombatZone) {
            this.deployToTheatre();
            return;
        } else {
            this.manageCombatZone();
        }
    }

    private deployToTheatre() {
        if (this.theatre) {
            if (this.squad.path) {
                this.squad.activeCombatZone = true;
                this.theatre.tick = 75;
            } else {
                if (this.squadCreeps && this.squadCreeps.length > 1 && this.theatre.deploymentPath) {
                    BaseSquad.migrateCachedPathToSquad(
                        this.squad,
                        this.theatre.deploymentPath,
                        this.squadCreeps[1].pos.getDirectionTo(this.squadCreeps[0])
                    );
                    this.handleSquadPath(this.squad);
                } else {
                    console.log(
                        `Could not map creeps or did not have a theatre deployment path: ${JSON.stringify(
                            this.theatre
                        )}`
                    );
                }
            }
        } else {
            console.log(`Theatre could not be found for squad: ${JSON.stringify(this.squad)}`);
        }
    }

    private manageCombatZone() {
        if (this.theatre) {
            const room: Room | null = Game.rooms[this.theatre.roomName];
            const squadPosition = new RoomPosition(this.squad.pos[0], this.squad.pos[1], room.name);
            if (room) {
                if (this.theatre.culled) {
                    if (this.squad.focus) {
                        this.handleFocusTarget(squadPosition);
                    } else {
                        const target = _.first(squadPosition.findInRange(FIND_HOSTILE_CREEPS, 2));
                        if (target) {
                            this.squad.focus = target.id;
                            this.handleSKCombat(target, squadPosition);
                            return;
                        } else if (this.theatre.tick < 0) {
                            this.theatre.tick = 75 + this.theatre.tick;
                            this.theatre.currentSegment++;
                            // Handle segment reset
                            if (this.theatre.patrolSegments) {
                                if (this.theatre.currentSegment >= this.theatre.patrolSegments.length) {
                                    this.theatre.currentSegment = 0;
                                }
                                this.squad.path = this.theatre.patrolSegments[this.theatre.currentSegment];
                                this.handleSquadPath(this.squad);
                            }
                        }
                    }
                } else {
                    if (this.squad.focus) {
                        this.handleFocusTarget(squadPosition);
                    } else {
                        const sks: Creep[] | null = room.find(FIND_HOSTILE_CREEPS);
                        if (sks && sks.length > 0) {
                            const target = squadPosition.findClosestByPath(sks);
                            if (target) {
                                this.squad.focus = target.id;
                                this.handleSKCombat(target, squadPosition);
                                return;
                            }
                        } else {
                            const skLairs: StructureKeeperLair[] | null = room.find<StructureKeeperLair>(
                                FIND_STRUCTURES,
                                {
                                    filter: s => s.structureType === STRUCTURE_KEEPER_LAIR
                                }
                            );
                            if (skLairs && skLairs.length) {
                                // First update the deployment route and create the patrol segments
                                this.updateDeployment(skLairs, this.theatre);
                                // Traverse to the entry point, which should be the next position on the docket anyways.
                                this.traverseToPatrolStart(this.theatre, squadPosition);
                                this.theatre.culled = true;
                                this.theatre.tick = 75;
                            } else {
                                console.log("What on earth have you guys been doing?");
                            }
                        }
                    }
                }
            }
        }
    }

    private handleFocusTarget(squadPosition: RoomPosition) {
        const focusTarget: Creep | null = Game.getObjectById(this.squad.focus!);
        if (focusTarget) {
            this.handleSKCombat(focusTarget, squadPosition);
        } else {
            if (this.regroup()) {
                this.squad.focus = null;
            }
        }
    }

    private traverseToPatrolStart(theatre: Theatre, squadPosition: RoomPosition) {
        if (theatre.patrolSegments && theatre.patrolSegments.length > 0 && theatre.deploymentPath) {
            const startStep: PathStep = _.last(theatre.deploymentPath)!;
            const startPosition = new RoomPosition(startStep.x, startStep.y, theatre.roomName);
            this.squadPathDuo(this.squad, squadPosition, startPosition);
        }
    }

    private updateDeployment(lairs: StructureKeeperLair[], theatre: Theatre) {
        // Get end handle of current exit route for ballpark.
        const entry: PathStep | undefined = _.last(theatre.deploymentPath);
        if (entry) {
            const entryPosition: RoomPosition = new RoomPosition(entry.x, entry.y, theatre.roomName);
            const startLair: StructureKeeperLair | null = entryPosition.findClosestByPath(lairs);
            if (startLair) {
                lairs = _.remove(lairs, l => l.id === startLair.id);

                this.createNewDeploymentPath(theatre, startLair);
                this.createPatrolSegments(theatre, lairs);
            }
        }
    }

    private createPatrolSegments(theatre: Theatre, lairs: StructureKeeperLair[]) {
        const endStep: PathStep = _.last(theatre.deploymentPath)!;
        const beginWatchPosition: RoomPosition = new RoomPosition(endStep.x, endStep.y, theatre.roomName);
        let currentWatchPosition: RoomPosition = new RoomPosition(endStep.x, endStep.y, theatre.roomName);
        theatre.patrolSegments = [];
        while (lairs.length > 0) {
            const nextLair = currentWatchPosition.findClosestByPath(lairs);
            if (nextLair) {
                _.remove(lairs, l => l.id === nextLair.id);
                theatre.patrolSegments.push(currentWatchPosition.findPathTo(nextLair.pos, { range: 1 }));
                const endSegStep: PathStep = _.last(_.flatten(theatre.patrolSegments))!;
                currentWatchPosition = new RoomPosition(endSegStep.x, endSegStep.y, theatre.roomName);
            } else {
                console.log(`Couldn't path to remaining lairs: ${JSON.stringify(lairs)}`);
                lairs = [];
            }
        }
        theatre.patrolSegments.push(currentWatchPosition.findPathTo(beginWatchPosition));
    }

    private createNewDeploymentPath(theatre: Theatre, startLair: StructureKeeperLair) {
        const pfp: PathFinderPath = PathFinder.search(theatre.rallyLocation, { pos: startLair.pos, range: 1 });
        let translatedPath: RoomPathCostingRetainer[] = new Array<RoomPathCostingRetainer>();
        pfp.path = _.concat([theatre.rallyLocation], pfp.path);
        GeneralBuilding.translateOneWay(pfp.path, translatedPath);
        theatre.deploymentPath = [];
        for (const roomPath of _.values(translatedPath)) {
            theatre.deploymentPath = _.concat(theatre.deploymentPath, roomPath.path);
        }
    }

    private handleSKCombat(target: Creep, squadPosition: RoomPosition) {
        const engageDistance = squadPosition.getRangeTo(target);
        if (!this.squadCreeps) {
            this.mapSquad(this.squad);
        }
        if (this.squadCreeps && this.squadCreeps.length === 2) {
            const knight: Creep = this.squadCreeps[0];
            const healer: Creep = this.squadCreeps[1];
            if (engageDistance > 6) {
                this.squadPathDuo(this.squad, squadPosition, target.pos, 1);
            } else {
                if (engageDistance > 3) {
                    if (healer.pos.getRangeTo(target) < knight.pos.getRangeTo(target)) {
                        this.squad.cacheDirection = healer.pos.getDirectionTo(knight);
                        this.squadMove(this.squad, knight.pos.getDirectionTo(healer));
                    } else {
                        this.squadMove(this.squad, squadPosition.getDirectionTo(target));
                    }
                } else if (engageDistance > 1) {
                    this.squadMove(this.squad, squadPosition.getDirectionTo(target));
                } else {
                    knight.attack(target);
                }
                this.handleHealing(knight, healer);
                knight.memory.moved = true;
                healer.memory.moved = true;
            }
        } else {
            this.retireSquad(this.theatre!);
        }
    }

    private handleHealing(knight: Creep, healer: Creep) {
        if (healer.getActiveBodyparts(HEAL) < healer.body.length / 2) {
            healer.heal(healer);
        } else if (knight.hitsMax - knight.hits < healer.hitsMax - healer.hits) {
            healer.heal(healer);
        } else {
            healer.heal(knight);
        }
    }

    private regroup() {
        if (!this.squadCreeps) {
            this.mapSquad(this.squad);
        }
        if (this.squadCreeps && this.squadCreeps.length === 2) {
            const knight: Creep = this.squadCreeps[0];
            const healer: Creep = this.squadCreeps[1];
            if (knight.hits !== knight.hitsMax || healer.hits !== healer.hitsMax) {
                this.handleHealing(knight, healer);
                healer.memory.moved = true;
                knight.memory.moved = true;
            } else {
                return true;
            }
        } else {
            this.retireSquad(this.theatre!);
        }
        return false;
    }

    private retireSquad(theatre: Theatre) {
        theatre.squadActive = false;
        delete Memory.squads[this.squad.squadName];
        theatre.currentSegment = 0;
        theatre.tick = 0;
    }
}
