import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";

export class remoteHarvestHandler extends RemoteDispatcher {
  public requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
    const remoteHarvest = this.GetRemoteHarvest(Game.creeps[dispatchRequest.creep.room.name]);
    if (remoteHarvest) {
      return this.RequestDispatch(dispatchRequest, remoteHarvest);
    }
    return null;
  }

  public GetRemoteHarvest(creep: Creep): RemoteHarvest | null {
    const spawns = _.filter(_.values(Game.spawns), s => {
      return s.room.name === creep.memory.home;
    });
    if (spawns) {
      for (const spawn of spawns) {
        const remoteHarvest = _.find(spawn.memory.remoteHarvests, rm => {
          return rm.vein === creep.memory.dedication;
        });
        if (remoteHarvest) {
          return remoteHarvest;
        }
      }
    }
    return null;
  }
}
