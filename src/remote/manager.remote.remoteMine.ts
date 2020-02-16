import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../spawning/manager.dedicatedCreepRequester";
import _ from "lodash";
import { BodyBuilder } from "spawning/spawning.bodyBuilder";

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
        if (!this.mine.configured) {
            this.configureMine();
        }
        if (checkPersonnel) {
            this.checkPersonnel();
        }
    }

    private checkPersonnel() {
        if (this.spawn.spawning) {
            return;
        }
        if (this.mine.miner) {
            if (this.minerPreSpawn()) {
                this.requestMiner();
            } else {
                const miner = Game.creeps[this.mine.miner];
                if (!miner) {
                    if (!this.creepInQueue(CreepRole.dropper)) {
                        this.requestMiner();
                    }
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

    private minerPreSpawn(): boolean {
        return false;
    }

    private removeUnusedHaulers() {
        for (const hauler of this.mine.haulers!) {
            if (!Game.creeps[hauler]) {
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
                dedication: this.mine.vein,
                role: CreepRole.harvester,
                specifiedName: `${this.spawn.name}_BPR_${containerRoomName}`,
                precious: RESOURCE_ENERGY,
                isRemote: true,
                orders: orders
            });
        }
    }

    private getActiveRemoteHarvesterBuilder(roomName: string): Creep | null {
        for (const creep of _.values(Game.creeps)) {
            if (creep.memory.role === CreepRole.harvester) {
                if (creep.memory.dedication) {
                    if (creep.memory.dedication === roomName) {
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
        if (this.mine.haulers!.length > 0) {
            this.mine.haulers?.push(haulerName);
        } else {
            this.mine.haulers = [haulerName];
        }
    }

    private configureMine() {
        let distance: number = 0;
        for (let pathRoom of _.values(this.mine.pathingLookup)) {
            const departing = pathRoom[0];
            if (departing) {
                distance += departing.length;
                console.log(`Adding ${pathRoom.length} for: ${JSON.stringify(pathRoom)}`);
            }
        }
        console.log(`Distance is: ${distance}`);
        let multiplier = 1;
        if (this.mine.reserved) {
            multiplier = 2;
        }

        const requiredCarry: number = Math.floor((distance * multiplier) / 5);

        console.log(`RequiredCarry is: ${requiredCarry}`);
        // Check if we can consolidate into a single hauler.
        if (this.spawn.room.energyCapacityAvailable > requiredCarry * 50) {
            // We can just use a single hauler.
            this.mine.haulerBody = BodyBuilder.generateHaulerBody(requiredCarry, true);
            this.mine.haulerCount = 1;
            this.mine.configured = true;
        } else {
            let haulerCount = 2;
            while (!this.mine.configured) {
                if (this.spawn.room.energyCapacityAvailable > (requiredCarry * 50) / haulerCount) {
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
