import _ from "lodash";

export class ConstructionSiteCacher {
    private static roomSiteMap: Dictionary<ConstructionSite<BuildableStructureConstant>> = {};

    public static getConstructionSiteRoom(room: Room): ConstructionSite<BuildableStructureConstant> | null {
        if (!(room.memory.constructionSites == null)) {
            if (room.memory.constructionSites.length > 0) {
                // Check if site already pulled and still valid.
                const roomSite = this.roomSiteMap[room.name];
                if (roomSite) {
                    return roomSite;
                } else {
                    // See if we need to refresh our target.
                    const site = Game.getObjectById<ConstructionSite<BuildableStructureConstant>>(
                        _.first(room.memory.constructionSites)!
                    );
                    if (site) {
                        // Store object for local cycle memory and return it.
                        _.set(this.roomSiteMap, room.name, site);
                        return site;
                    } else {
                        // Refresh our object list.
                        return this.dropAndRefreshLazy(room);
                    }
                }
            } else {
                this.updateConstructionSites(room);
            }
        } else {
            this.updateConstructionSites(room);
        }
        return null;
    }

    public static dispose() {
        this.roomSiteMap = {};
    }

    // Lazy method. Uses internal room memory to check for a new target, but will not seek out a data refresh.
    private static dropAndRefreshLazy(room: Room) {
        if (room.memory.constructionSites.length > 1) {
            room.memory.constructionSites = _.drop(room.memory.constructionSites);
            const site = Game.getObjectById<ConstructionSite<BuildableStructureConstant>>(
                _.first(room.memory.constructionSites)!
            );
            _.set(this.roomSiteMap, room.name, site);
            return site;
        } else {
            room.memory.constructionSites = _.drop(room.memory.constructionSites);
            return null;
        }
    }

    public static updateConstructionSites(room: Room) {
        room.memory.constructionSites = _.map(
            _.filter(_.values(Game.constructionSites), cs => cs?.room?.name === room.name),
            "id"
        );
    }
}
