import { controllerCacher } from "managers/manager.controllerCacher";

export function upgradeController(creep: Creep): boolean {
    let target = controllerCacher.getcontrollerRoom(creep.room);
    if (target) {
        if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#AE02E6', strokeWidth: .15 } });
            return true;
        }
        else {
            return true;
        }
    }
    return false;
}

