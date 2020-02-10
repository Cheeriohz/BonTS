import { LocalExpansion } from "building/building.LocalExpansion";
import { TerminalExpansion } from "building/building.terminalExpansion";
import _ from "lodash";
import { LabAddition } from "building/building.labAddtition";
import { RemoteHarvestHandler } from "remote/remote.remoteHarvestHandler";
import { ExtensionAddition } from "building/building.extensionAddition";
import { SpawnTemplate } from "spawning/spawning.templating";
import { CreepRequester } from "spawning/manager.creepRequester";
import { CreepRole } from "enums/enum.roles";
import { buildProjectCreator } from "building/building.buildProjectCreator";

export class RCLUpgradeHandler {
    public static handleRCLUpgrades(spawn: StructureSpawn) {
        // TODO This requires us moving our RCLUpgrade to be room level or global rather than just spawn level... eventually
        if (spawn.room.memory?.rclUpgrades) {
            const rclUpgradeEvent: RCLUpgradeEvent = spawn.room.memory.rclUpgrades[0];
            if (rclUpgradeEvent) {
                switch (rclUpgradeEvent.newRclLevel) {
                    case 1: {
                        if (this.handleRCLUpgradeTo1(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 2: {
                        if (this.handleRCLUpgradeTo2(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 3: {
                        if (this.handleRCLUpgradeTo3(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 4: {
                        if (this.handleRCLUpgradeTo4(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 6: {
                        if (this.handleRCLUpgradeTo6(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    case 7: {
                        if (this.handleRCLUpgradeTo7(spawn)) {
                            _.remove(spawn.room.memory.rclUpgrades, rclUpgradeEvent);
                        }
                        break;
                    }
                    default: {
                        console.log(`No handling implemented for RCL Level ${rclUpgradeEvent.newRclLevel}`);
                    }
                }
            }
        }
    }
    private static handleRCLUpgradeTo1(spawn: StructureSpawn): boolean {
        RCLUpgradeHandler.stealRemoteHarvesters(spawn);
        return true;
    }

    private static handleRCLUpgradeTo2(spawn: StructureSpawn): boolean {
        if (!spawn.room.memory.reservedBuilds || !(spawn.room.memory.reservedBuilds.length > 0)) {
            const localExpansion: LocalExpansion = new LocalExpansion(spawn, spawn.room, spawn.pos, false);
            localExpansion.routeToSources();
            localExpansion.routeToController();
        }
        if (!this.handleRoomExtensionsBootstrap(spawn)) {
            return false;
        }
        const cr: CreepRequester = new CreepRequester(spawn);
        cr.RequestIndependentScout();
        return true;
    }

    private static handleRCLUpgradeTo3(spawn: StructureSpawn): boolean {
        if (!this.handleRoomExtensionsEnqueue([spawn], true, 10)) {
            return false;
        }
        const localExpansion: LocalExpansion = new LocalExpansion(spawn, spawn.room, spawn.pos, false);
        localExpansion.checkForContainerExpansion();
        // TODO Add tower
        return true;
    }

    private static handleRCLUpgradeTo4(spawn: StructureSpawn): boolean {
        // TODO Add storage
        const bpc: buildProjectCreator = new buildProjectCreator(spawn.room, spawn);
        bpc.createReservedRoads();
        if (!this.handleRoomExtensionsEnqueue([spawn], true, 20)) {
            return false;
        }
        return true;
    }

    private static handleRCLUpgradeTo6(spawn: StructureSpawn): boolean {
        const localExpansion: LocalExpansion = new LocalExpansion(spawn, spawn.room, spawn.pos, false);
        localExpansion.checkForMineralExpansion();

        // Check if we need a terminal.
        if (
            !_.find(
                _.values(Game.structures),
                s => s.room.name === spawn.room.name && s.structureType === STRUCTURE_TERMINAL
            )
        ) {
            const terminalExpansion: TerminalExpansion = new TerminalExpansion(spawn);
            if (!terminalExpansion.enqueueTerminalProject()) {
                return false;
            }
        }
        const le: LabAddition = new LabAddition(spawn);
        if (!le.alreadyProcessedSuccessfully(6)) {
            if (!le.enqueueLabProject(3)) {
                return false;
            }
        }
        return true;
    }

    private static handleRCLUpgradeTo7(spawn: StructureSpawn): boolean {
        if (!this.handleRoomExtensionsEnqueue([spawn], true, 50)) {
            return false;
        }
        /*
		const sa: SpawnAddition = new SpawnAddition(spawn);
		if(!sa.enqueSpawnProject()) {
			return false;
		}

		const ta: TowerAddition = new TowerAddition(spawn);
		if(!ta.enqueueTowerProject()){
			return false;
		}
		*/

        const le: LabAddition = new LabAddition(spawn);
        if (!le.alreadyProcessedSuccessfully(7)) {
            if (!le.enqueueLabProject(3)) {
                return false;
            }
        }

        /*
		const fa: FactoryAddition = new FactoryAddition(spawn);
		if(!fa.enqueueFactoryProject()) {
			return false;
		}
		*/
        return true;
    }

    private static stealRemoteHarvesters(spawn: StructureSpawn) {
        for (let c of _.values(Game.creeps)) {
            if (c.memory.role === CreepRole.harvester && c.memory.home && c.memory.orders!.target === spawn.room.name) {
                if (c.room.name === spawn.room.name) {
                    delete c.memory.home;
                    delete c.memory.orders;
                    delete c.memory.dedication;
                } else {
                    c.memory.home = spawn.room.name;
                }
            }
        }
    }

    private static handleRoomExtensionsBootstrap(spawn: StructureSpawn): boolean {
        const ea: ExtensionAddition = new ExtensionAddition([spawn], false);
        const returnCode = ea.alreadyProcessedSuccessfully(5);
        switch (returnCode) {
            case 0: {
                return ea.enqueExtensionsBootstrapProject();
            }
            case 1: {
                return true;
            }
            case 2: {
                return false;
            }
            default: {
                console.log("Unexpected return code in handleRoomExtensionsEnqueue");
                return false;
            }
        }
    }

    private static handleRoomExtensionsEnqueue(
        spawns: StructureSpawn[],
        buildRoads: boolean,
        extensionCap: number
    ): boolean {
        const ea: ExtensionAddition = new ExtensionAddition(spawns, buildRoads);
        const returnCode = ea.alreadyProcessedSuccessfully(extensionCap);
        switch (returnCode) {
            case 0: {
                return ea.enqueueExtensionsProject();
            }
            case 1: {
                return true;
            }
            case 2: {
                return false;
            }
            default: {
                console.log("Unexpected return code in handleRoomExtensionsEnqueue");
                return false;
            }
        }
    }
}
