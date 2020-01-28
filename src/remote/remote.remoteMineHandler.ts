import { RemoteDispatcher } from "./remote.dispatcher";
import _ from "lodash";

export class RemoteMineHandler extends RemoteDispatcher {
  public requestRemoteDispatch(dispatchRequest: RemoteDispatchRequest): PathStep[] | null {
    const remoteMine = this.GetRemoteMine(Game.creeps[dispatchRequest.creep.room.name]);
    if (remoteMine) {
      return this.RequestDispatch(dispatchRequest, remoteMine);
    }
    return null;
  }

  public GetRemoteMine(creep: Creep): RemoteMine | null {
    const spawns = _.filter(_.values(Game.spawns), s => {
      return s.room.name === creep.memory.home;
    });
    if (spawns) {
      for (const spawn of spawns) {
        const remoteMine = _.find(spawn.memory.remoteMines, rm => {
          return rm.containerId === creep.memory.dedication;
        });
        if (remoteMine) {
          return remoteMine;
        }
      }
    }
    return null;
  }
}
