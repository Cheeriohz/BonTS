import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../spawning/manager.dedicatedCreepRequester";
import _ from "lodash";
import { BodyBuilder } from "spawning/spawning.bodyBuilder";
import { CreepQualifiesAsActive } from "caching/caching.creepCaching";
import { RemoteMineHandler } from "./remote.remoteMineHandler";
import { buildProjectCreator } from "building/building.buildProjectCreator";

export class RemoteMineManager {
    room!: Room;
    spawn!: StructureSpawn;
    mine!: RemoteMine;

    constructor(room: Room, spawn: StructureSpawn, mine: RemoteMine) {
        this.room = room;
        this.spawn = spawn;
        this.mine = mine;
    }

    public manageMine(checkPersonnel: boolean) {
        this.checkForRoadMaintenance();
        if (!this.mine.configured) {
            this.configureMine();
        }
        if (checkPersonnel) {
            this.checkPersonnel();
        }
    }

    private checkForRoadMaintenance() {
        this.mine.cycleIterator = (this.mine.cycleIterator ?? 0) + 1;
        if (this.mine.cycleIterator > 20) {
            this.mine.cycleIterator = 0;
            // Check against containerId because it affords an easy check on if the mine has been built.
            if (this.mine.containerId) {
                for (const room of _.keys(this.mine.pathingLookup)) {
                    this.checkRoadsForRoom(room, this.mine.pathingLookup[room][0]);
                }
            }
        }
    }

    private checkRoadsForRoom(roomName: string, path: PathStep[]) {
        let createBuildProject: boolean = false;
        const roomScout = Memory.scouting.roomScouts[roomName];
        // Can't build in reserved rooms. We also won't keep scouts in them for visibility.
        if (roomScout && roomScout.threatAssessment) {
            return;
        }
        const room = Game.rooms[roomName];
        if (room) {
            for (const step of path) {
                const existingRoad: Structure[] | null = room.lookForAt(LOOK_STRUCTURES, step.x, step.y);
                if (!existingRoad || existingRoad.length === 0) {
                    if (room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD) === OK) {
                        createBuildProject = true;
                    }
                }
            }
        }
        if (createBuildProject) {
            const bpc: buildProjectCreator = new buildProjectCreator(room, this.spawn);
            bpc.rebuildRemoteCreate();
        }
    }
    private checkPersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.mine.miner) {
            if (!CreepQualifiesAsActive(this.mine.miner, this.mine.distance)) {
                if (!this.creepInQueue(CreepRole.dropper)) {
                    this.requestMiner();
                }
            }
        } else {
            this.requestMiner();
        }
        if (this.mine.haulers) {
            this.removeUnusedHaulers();
            if (this.mine.haulers.length < this.mine.haulerCount!) {
                if (!this.creepInQueue(CreepRole.hauler)) {
                    if (this.haulerNeeded()) {
                        this.requestHauler();
                    }
                }
            }
        } else {
            this.mine.haulers = [];
            this.requestHauler();
        }
    }

    private removeUnusedHaulers() {
        for (const hauler of this.mine.haulers!) {
            if (!CreepQualifiesAsActive(hauler)) {
                //console.log(`Removing Unused Hauler ${hauler} from : ${this.mine.haulers} at cycle: ${Memory.cycle}`);
                _.remove(this.mine.haulers!, h => {
                    return h === hauler;
                });
            }
        }
    }

    private haulerNeeded(): boolean {
        const room = Game.rooms[this.mine.roomName];
        if (room) {
            const container: StructureContainer | null = Game.getObjectById(this.mine.containerId!);
            if (container) {
                return true;
            } else {
                // Container has been destroyed, need to rebuild
                if (!this.reassignContainer()) {
                    this.rebuildContainer();
                }
            }
            return false;
        } else {
            return true;
        }
    }

    private reassignContainer(): boolean {
        const endPos = _.last(this.mine.pathingLookup[this.mine.roomName][0]);
        if (endPos) {
            const containerPos = new RoomPosition(endPos.x, endPos.y, this.mine.roomName);
            if (containerPos) {
                const container: Structure | undefined = containerPos
                    .lookFor(LOOK_STRUCTURES)
                    .find(object => object.structureType === STRUCTURE_CONTAINER);
                if (container) {
                    this.mine.containerId = <Id<StructureContainer>>container.id;
                    return true;
                }
            }
        }
        return false;
    }

    private rebuildContainer() {
        const endPos = _.last(this.mine.pathingLookup[this.mine.roomName][0]);
        if (endPos) {
            this.room.createConstructionSite(endPos.x, endPos.y, STRUCTURE_CONTAINER);
            this.maintainActiveRemoteHarvesterBuilder(this.mine.roomName);
        }
    }

    private maintainActiveRemoteHarvesterBuilder(containerRoomName: string) {
        if (!this.getActiveRemoteHarvesterBuilder(containerRoomName)) {
            const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
            const orders: CreepOrder = {
                target: this.mine.roomName,
                independentOperator: false
            };
            dcr.createdDedicatedCreepRequest({
                dedication: this.mine.vein!,
                role: CreepRole.harvester,
                specifiedName: `${this.spawn.name}_BPR_${containerRoomName}`,
                precious: this.mine.vein,
                isRemote: true,
                orders: orders
            });
        }
    }

    private getActiveRemoteHarvesterBuilder(roomName: string): Creep | Boolean | null {
        if (this.creepInQueue(CreepRole.harvester)) {
            return true;
        }
        for (const creep of _.values(Game.creeps)) {
            if (creep.memory.role === CreepRole.harvester) {
                if (creep.memory.precious) {
                    if (creep.memory.precious === this.mine.vein) {
                        return creep;
                    }
                }
            }
        }
        return null;
    }
    // END TODO

    private creepInQueue(role: CreepRole) {
        return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
            return dc.dedication === this.mine.containerId && dc.role === role;
        });
    }

    private requestMiner() {
        const minerName: string = `dMiner${this.room.name}${Memory.creepTicker}`;
        Memory.creepTicker++;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.mine.containerId!,
            role: CreepRole.dropper,
            specifiedName: minerName,
            precious: this.mine.vein,
            isRemote: true,
            orders: {
                target: this.mine.roomName,
                independentOperator: false
            },
            reserved: this.mine.reserved
        });
        this.mine.miner = minerName;
    }

    private requestHauler() {
        const haulerName: string = `dHauler${this.room.name}${Memory.creepTicker}`;
        Memory.creepTicker++;
        const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
        dcr.createdDedicatedCreepRequest({
            dedication: this.mine.containerId!,
            role: CreepRole.hauler,
            specifiedName: haulerName,
            precious: undefined,
            isRemote: true,
            orders: {
                target: this.mine.roomName,
                independentOperator: false
            },
            body: this.mine.haulerBody
        });
        this.mine.haulers!.push(haulerName);
    }

    private configureMine() {
        let distance: number = 0;
        for (let pathRoom of _.values(this.mine.pathingLookup)) {
            const departing = pathRoom[0];
            if (departing) {
                distance += departing.length;
            }
        }
        // Cache the distance for use elsewhere
        this.mine.distance = distance;

        let multiplier = 1;
        if (this.mine.reserved) {
            multiplier = 2;
        }

        const requiredCarry: number = Math.floor((distance * multiplier) / 5);

        // Check if we can consolidate into a single hauler.
        if (this.spawn.room.energyCapacityAvailable > requiredCarry * 1.5 * 50 + 100) {
            // We can just use a single hauler.
            this.mine.haulerBody = BodyBuilder.generateHaulerBody(requiredCarry, true);
            this.mine.haulerCount = 1;
            this.mine.configured = true;
        } else {
            let haulerCount = 2;
            while (!this.mine.configured) {
                if (this.spawn.room.energyCapacityAvailable > (requiredCarry * 1.5 * 50 + 100) / haulerCount) {
                    this.mine.haulerBody = BodyBuilder.generateHaulerBody(requiredCarry / haulerCount, true);
                    this.mine.haulerCount = haulerCount;
                    this.mine.configured = true;
                } else {
                    haulerCount++;
                }
            }
        }
    }
}
