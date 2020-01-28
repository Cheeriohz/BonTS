import { CreepRole } from "enums/enum.roles";
import { DedicatedCreepRequester } from "../cycle/manager.dedicatedCreepRequester";
import _ from "lodash";

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
          if (!this.creepNotInQueue(this.mine.miner)) {
            const container: StructureContainer | null = Game.getObjectById(this.mine.containerId!);
            if (container) {
              if (this.minerPreSpawn()) {
                this.requestMiner();
              }
            } else {
              if (!this.reassignContainer()) {
                this.rebuildContainer();
              }
              return;
            }
          }
        }
      }
    } else {
      this.requestMiner();
    }
    if (this.mine.haulers) {
      this.removeUnusedHaulers();
      if (this.mine.haulers.length < 2) {
        if (this.haulerNeeded()) {
          this.requestHauler();
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
    const container: StructureContainer | null = Game.getObjectById(this.room.memory.mine!.containerId);
    if (container) {
      return true;
    } else {
      // Container has been destroyed, need to rebuild
      if (!this.reassignContainer()) {
        this.rebuildContainer();
      }
    }
    return false;
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
      this.maintainActiveRemoteBuilder(this.mine.roomName);
    }
  }

  // TODO -  This code is common to remote. Should make it available external to any one class.
  private maintainActiveRemoteBuilder(containerRoomName: string) {
    if (!this.getActiveRemoteBuilder(containerRoomName)) {
      const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
      dcr.createdDedicatedCreepRequest(
        containerRoomName,
        CreepRole.builder,
        `${this.spawn.name}_BPR_${containerRoomName}`,
        undefined,
        true
      );
    }
  }

  private getActiveRemoteBuilder(roomName: string): Creep | null {
    for (const creep of _.values(Game.creeps)) {
      if (creep.memory.role === CreepRole.builder) {
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

  private creepNotInQueue(creepName: string) {
    return _.find(this.spawn.memory.dedicatedCreepRequest, dc => {
      return dc.specifiedName === creepName;
    });
  }

  private requestMiner() {
    const minerName: string = `dMiner${this.room.name}${Game.time}`;
    const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
    dcr.createdDedicatedCreepRequest(this.mine.containerId!, CreepRole.dropper, minerName, this.mine.vein, true, {
      target: this.mine.roomName,
      independentOperator: false
    });
    this.mine.miner = minerName;
  }

  private requestHauler() {
    const haulerName: string = `dMiner${this.room.name}${Game.time}`;
    const dcr: DedicatedCreepRequester = new DedicatedCreepRequester(this.spawn);
    dcr.createdDedicatedCreepRequest(this.mine.containerId!, CreepRole.hauler, haulerName, undefined, true, {
      target: this.mine.roomName,
      independentOperator: false
    });
    if (this.mine.haulers!.length > 0) {
      this.mine.haulers?.push(haulerName);
    } else {
      this.mine.haulers = [haulerName];
    }
  }
}
