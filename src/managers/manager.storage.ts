export class StorageManager {

    public static excessEnergyWithdrawal(creep: Creep) {
        const storage = creep.pos.findClosestByRange<StructureStorage>(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_STORAGE
        });
        if (storage && storage.store) {
            if (storage.store.energy > 2000) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { reusePath: 20, visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        }
        return null;
    }
}
