import { CreepRole } from "enums/enum.roles";
import { RoleTaxi } from "roleDefinitions/role.taxi";
import _ from "lodash";
import { SpawnWrapper } from "spawning/spawning.spawnWrappers";

export class TaxiServiceManager {
    public static requestTaxi(creep: Creep, destination: RoomPosition, priority: number, arrivalDistance?: number) {
        creep.say("🖐️!");
        const offDutyTaxi = creep.pos.findClosestByRange(FIND_MY_CREEPS, { filter: c => this.isAvailableTaxi(c) });
        if (offDutyTaxi) {
            this.designateDriver(offDutyTaxi, creep, destination, priority, arrivalDistance);
            return;
        }
        const newDriver = creep.pos.findClosestByPath(FIND_MY_CREEPS, { filter: c => this.canReassignForTaxi(c) });
        if (newDriver) {
            this.designateDriver(newDriver, creep, destination, priority, arrivalDistance);
            return;
        }
        // If we get this far, there are no available taxis;
        if (creep.room.memory.spawns) {
            // TODO this doesn't account for spawn requests this turn;
            const energyAvailable = creep.room.energyAvailable;
            if (energyAvailable > 100) {
                for (const spawnId of creep.room.memory.spawns) {
                    const spawn = Game.getObjectById(spawnId);
                    if (spawn && spawn.spawning === null) {
                        SpawnWrapper.spawnACreep(
                            spawn,
                            this.GetTaxiBody(creep.room),
                            `taxi${Memory.creepTicker}`,
                            CreepRole.taxi
                        );
                        Memory.creepTicker++;
                    }
                }
            }
        }
    }

    private static GetTaxiBody(room: Room): BodyPartConstant[] {
        // TODO make ... better
        return [CARRY, MOVE];
    }

    public static checkRequest(client: Creep) {
        if (client.memory.time) {
            if (Game.time - client.memory.time > 25) {
                client.memory.time = Game.time;
                const fulfillers: Creep[] | null = _.compact(
                    _.filter(_.values(Game.creeps), c => {
                        return c.memory.role === CreepRole.taxi;
                    })
                );
                if (fulfillers && fulfillers.length > 0) {
                    for (let fulfiller of fulfillers) {
                        if (fulfiller.memory.taxi && fulfiller.memory.taxi.client === client.name) {
                            if (fulfiller.pos.getRangeTo(client) !== 1) {
                                this.fireDriver(fulfiller);
                                client.memory.activeTaxi = false;
                                return;
                            } else {
                                // Everything should in theory be working in this case.
                                return;
                            }
                        }
                    }
                }
                client.memory.activeTaxi = false;
                return;
            }
        } else {
            client.memory.time = Game.time;
        }
    }

    private static fireDriver(driver: Creep) {
        driver.memory.role = driver.memory.taxi!.originalRole;
        delete driver.memory.taxi;
    }

    private static isAvailableTaxi(creep: Creep): boolean {
        if (
            creep.memory.role === CreepRole.taxi &&
            !creep.memory.dedication &&
            !creep.memory.home &&
            !creep.memory.taxi
        ) {
            return true;
        } else {
            return false;
        }
    }

    private static canReassignForTaxi(creep: Creep): boolean {
        if (
            (creep.memory.role === CreepRole.hauler ||
                creep.memory.role === CreepRole.topper ||
                creep.memory.role === CreepRole.harvester) &&
            !creep.memory.dedication &&
            !creep.memory.home &&
            !creep.memory.taxi
        ) {
            return true;
        } else {
            return false;
        }
    }

    private static designateDriver(
        driver: Creep,
        client: Creep,
        destination: RoomPosition,
        priority: number,
        arrivalDistance?: number
    ) {
        const taxi: Taxi = {
            client: client.name,
            destination: destination,
            priority: priority,
            originalRole: driver.memory.role,
            taxiRoute: null,
            arrivalDistance: arrivalDistance
        };
        driver.memory.role = CreepRole.taxi;
        driver.memory.taxi = taxi;
        driver.memory.path = null;
        driver.say("🚕");
        client.memory.activeTaxi = true;
        client.memory.time = Game.time;
        const rt: RoleTaxi = new RoleTaxi();
        rt.run(driver);
    }
}
