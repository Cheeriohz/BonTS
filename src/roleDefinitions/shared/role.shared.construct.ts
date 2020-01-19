import { ConstructionSiteCacher } from "managers/manager.constructionSiteCacher";

export function construct(creep: Creep): boolean {
    const target = ConstructionSiteCacher.getConstructionSiteRoom(creep.room);
    if (target) {
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#FAAC58' } });
            return true;
        }
        else {
            return true;
        }
    }
    return false;
}

