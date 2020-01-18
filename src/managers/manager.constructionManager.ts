import _ from "lodash";

export class constructionManager {
    private static roomSiteMap: Dictionary<ConstructionSite<BuildableStructureConstant>> = {};

    public static getConstructionSiteRoom(room: Room) {
        if (!(room.memory.constructionSites == null)) {
            if (room.memory.constructionSites.length > 0) {
                //Check if site already pulled and still valid.
                if (this.roomSiteMap[room.name]) {
                    return this.roomSiteMap[room.name]
                }
                else {
                    //See if we need to refresh our room id list.
                    //const site = null;
                    try {
                        const site = Game.getObjectById<ConstructionSite<BuildableStructureConstant>>(room.memory.constructionSites[0])
                        if (site) {
                            //Store object for local cycle memory and return it.
                            _.set(this.roomSiteMap, room.name, site);
                            return site;
                        }
                        else {
                            //Refresh our object list.
                            return this.popAndRefreshLazy(room);
                        }
                    } catch (error) {
                        console.log(error);
                        return this.popAndRefreshLazy(room);
                    }
                }
            }
        }
        else {
            this.updateConstructionSites(room);
        }
        return null;
    }

    // Lazy method. Uses internal room memory to check for a new target, but will not seek out a data refresh.
    private static popAndRefreshLazy(room: Room) {
        if (room.memory.constructionSites.length > 1) {
            room.memory.constructionSites.pop();
            const site = Game.getObjectById<ConstructionSite<BuildableStructureConstant>>(room.memory.constructionSites[0]);
            _.set(this.roomSiteMap, room.name, site);
            return site;
        }
        else {
            room.memory.constructionSites.pop();
            return null;
        }

    }

    public static updateConstructionSites(room: Room) {
        room.memory.constructionSites = _.map(room.find(FIND_CONSTRUCTION_SITES), 'id');
    }


}
