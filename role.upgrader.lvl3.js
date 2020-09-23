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
                if(creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            if(creep.store.getFreeCapacity() === 0) {
                creep.memory.upgrading = true;
            }
        }
        if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE)
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
};

module.exports = roleUpgraderLvl3;