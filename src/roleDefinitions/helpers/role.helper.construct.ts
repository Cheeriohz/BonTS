import { constructionSiteCacher } from "managers/manager.constructionSiteCacher";

export class constructHelper {

    public static construct(creep: Creep): boolean {
        const target = constructionSiteCacher.getConstructionSiteRoom(creep.room);
        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#FAAC58' } });
                return true;
            }
            else {
                return true;
            }
        }
        return false;
    }
}
