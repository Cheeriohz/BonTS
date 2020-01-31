
import { RoleRemote } from "roleDefinitions/base/role.remote";
import { RemoteMineHandler } from "remote/remote.remoteMineHandler";
import { RemoteDispatcher } from "remote/remote.dispatcher";


export class RoleRemoteBuilder extends RoleRemote {

    public run(creep: Creep) {
        const currentEnergy = creep.store[RESOURCE_ENERGY]
        if (creep.memory.working && currentEnergy === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
            //this.testRemoteDispatchR(creep)
            //return;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧 build');
            //this.testRemoteDispatch(creep);
            //return;
        }

        if (creep.memory.working) {
			this.constructRemote(creep, creep.memory.dedication!, true);
			return;
        }
        else {
			this.fillUpAtHome(creep);
			return;
        }
    }

    private testRemoteDispatchR(creep: Creep) {
        const spawn = Game.spawns['Sp1'];
        if (spawn) {
            const remoteMines = spawn.memory.remoteMines;
            if (remoteMines) {
                const remoteMine = remoteMines[0];
                const remoteDispatcher: RemoteDispatcher = new RemoteDispatcher();
                const time = Game.cpu.getUsed();
                const path = remoteDispatcher.RequestDispatch({ creep: creep, departing: false }, remoteMine);
                console.log(`Dispatch Lookup Takes: ${Game.cpu.getUsed() - time}`);
                if (path) {
                    creep.moveByPath(path);
                    creep.moveByPath(path);
                }
            }
        }
    }

    private testRemoteDispatch(creep: Creep) {
        const spawn = Game.spawns['Sp1'];
        if (spawn) {
            const remoteMines = spawn.memory.remoteMines;
            if (remoteMines) {
                const remoteMine = remoteMines[0];
                const remoteDispatcher: RemoteDispatcher = new RemoteDispatcher();
                const time = Game.cpu.getUsed();
                const path = remoteDispatcher.RequestDispatch({ creep: creep, departing: true }, remoteMine);
                console.log(`Dispatch Lookup Takes: ${Game.cpu.getUsed() - time}`);
                if (path) {
                    creep.moveByPath(path);
                }
            }
        }
    }
};
