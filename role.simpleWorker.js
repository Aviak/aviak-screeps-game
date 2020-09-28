let pathfinding = require('pathfinding');

let roleSimpleWorker = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.harvesting = true;
            creep.memory.upgrading = false;
        }
        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity(RESOURCE_ENERGY) && creep.memory.harvesting) {
            // let source = creep.pos.findClosestByPath(FIND_SOURCES);
            // if(creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
            //     creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            // }
            let sources = creep.room.find(FIND_SOURCES);
            let source = undefined;
            if(creep.memory.sourceId) {
                source = Game.getObjectById(creep.memory.sourceId);
            }
            if(!source) {
                let min = Number.MAX_VALUE;
                for(let sourceName in sources) {
                    let curSourceId = sources[sourceName].id;
                    if(!Memory.structures[curSourceId]) {
                        Memory.structures[curSourceId] = {creeps : 0};
                    }
                    if(Memory.structures[curSourceId].creeps < min) {
                        min = Memory.structures[curSourceId].creeps;
                        source = sources[sourceName];
                    }
                }
            }
            if(source) {
                Memory.structures[source.id].creeps++;
                creep.memory.onDeathEffect = true;
                creep.memory.sourceId = source.id;
                if(creep.pos.getRangeTo(source) > 1) {
                    pathfinding.modMoveTo(creep, source.pos, 1);
                }
                creep.harvest(source);
            }

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
                        creep.transfer(targets[0], RESOURCE_ENERGY);
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

    },

    processOnDeathEffect : function(creepName) {
        if(Memory.creeps[creepName].sourceId) {
            // console.log(Memory.creeps[creepName].target);
            Memory.structures['id'+Memory.creeps[creepName].sourceId].creeps--;
            //Memory.creeps[creepName].requested = 0;
            console.log('Simple worker OnDeath effect ' + creepName);
        }

    }
};

module.exports = roleSimpleWorker;