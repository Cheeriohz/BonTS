import { CreepRole } from "enums/enum.roles";
import { RoleTaxi } from "roleDefinitions/role.taxi";

export class TaxiServiceManager {
    public static requestTaxi(creep: Creep, destination: RoomPosition, priority: number) {
        const newDriver = creep.pos.findClosestByPath(FIND_MY_CREEPS, { filter: c => this.canReassignForTaxi(c) });
        if (newDriver) {
            this.reassignAsDriver(newDriver, creep, destination, priority);
        }
        creep.say("🖐️!");
    }

    private static canReassignForTaxi(creep: Creep): boolean {
        if (
            (creep.memory.role === CreepRole.hauler ||
                creep.memory.role === CreepRole.topper ||
                creep.memory.role === CreepRole.harvester) &&
            !creep.memory.dedication &&
            !creep.memory.home
        ) {
            return true;
        } else {
            return false;
        }
    }

    private static reassignAsDriver(driver: Creep, client: Creep, destination: RoomPosition, priority: number) {
        const taxi: Taxi = {
            client: client.name,
            destination: destination,
            priority: priority,
            originalRole: driver.memory.role,
            taxiRoute: null
        };
        driver.memory.role = CreepRole.taxi;
        driver.memory.taxi = taxi;
        driver.memory.path = null;
        driver.say("🚕");
        const rt: RoleTaxi = new RoleTaxi();
        rt.run(driver);
    }
}
