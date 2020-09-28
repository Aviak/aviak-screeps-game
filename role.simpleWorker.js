let pathfinding = require('pathfinding');

let roleSimpleWorker = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.harvesting = true;
            creep.memory.upgrading = false;
        }
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity(RESOURCE_ENERGY) && creep.memory.harvesting) {
            let source = creep.pos.findClosestByPath(FIND_SOURCES);
            // if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
            //     creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            // }
            if(creep.pos.getRangeTo(source) > 1) {
                pathfinding.modMoveTo(creep, source.pos, 1);
            }
            creep.harvest(source);
        }
        else {
            if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 && !creep.memory.harvesting) {
                creep.memory.harvesting = true;
                creep.memory.upgrading = false;
            }
            else {
                //console.log('333');
                creep.memory.harvesting = false;
                if(!creep.memory.upgrading) {
                    let targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType === STRUCTURE_EXTENSION ||
                                structure.structureType === STRUCTURE_SPAWN ||
                                structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                        }
                    });
                    if(targets.length > 0) {
                        // if(creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        //     creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        // }
                        if(creep.pos.getRangeTo(targets[0]) > 1) {
                            pathfinding.modMoveTo(creep, targets[0].pos, 1);
                        }
                        creep.transfer(targets[0]);
                    }
                    else {
                        creep.memory.upgrading = true;
                    }
                }
                //console.log('444');
                //console.log(JSON.stringify(creep.store));
                //console.log(creep.store[RESOURCE_ENERGY]);
                //.log(creep.store.getUsedCapacity(RESOURCE_ENERGY));
                if(creep.memory.upgrading && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    //console.log('222');
                    // if(creep.memory.upgrading && creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    //     creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                    // }
                    if(creep.memory.upgrading) {
                        if(creep.pos.getRangeTo(creep.room.controller) > 3) {
                            pathfinding.modMoveTo(creep, creep.room.controller.pos, 3);
                        }
                        creep.upgradeController(creep.room.controller);
                    }

                }

            }

        }

    }

};

module.exports = roleSimpleWorker;