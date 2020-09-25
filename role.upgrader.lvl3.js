var roleUpgraderLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store.getUsedCapacity() === 0) {
            creep.memory.upgrading = false;
        }

        if(!creep.memory.upgrading) {
            let targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                                        && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                                        && Memory.structures['id'+structure.id]
                                        && Memory.structures['id'+structure.id].containerType === 'Request'
            });
            if(!targetContainer) {
                targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                        && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                });
            }
            if(targetContainer) {
                if(creep.pos.getRangeTo(targetContainer) > 1) {
                    creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
                if(creep.withdraw(targetContainer, RESOURCE_ENERGY) === OK) {
                    creep.memory.upgrading = true;
                }
            }
            if(creep.store.getFreeCapacity() === 0) {
                creep.memory.upgrading = true;
            }
        }
        if(creep.memory.upgrading) {
            if(creep.pos.getRangeTo(creep.room.controller) >= 3) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            creep.upgradeController(creep.room.controller);
        }
    }
};

module.exports = roleUpgraderLvl3;