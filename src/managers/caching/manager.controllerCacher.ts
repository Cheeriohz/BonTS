import _ from "lodash";

export class ControllerCacher {
    private static roomControllerMap: Dictionary<StructureController> = {};


    public static getcontrollerRoom(room: Room) {
        if (!(room.memory.controller == null)) {

            // Check if we've already stored the controller object.
            const roomController = this.roomControllerMap[room.name];
            if (roomController) {
                return roomController;
            }
            else {
                // Refresh the object in the dictionary.
                const site = Game.getObjectById<StructureController>(room.memory.controller)
                if (site) {
                    // Store object for local cycle memory and return it.
                    _.set(this.roomControllerMap, room.name, site);
                    return site;
                }
            }

        }
        return null;
    }

    public static dispose() {
        this.roomControllerMap = {};
    }

    public static checkForController(room: Room) {
        const controllerId = room.find<StructureController>(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTROLLER);
            }
        })?.pop()?.id;

        if (controllerId) {
            room.memory.controller = controllerId;
        }

    }


}
