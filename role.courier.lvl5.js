var pathfinding = require('pathfinding');

var roleCourierLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.onDeathEffect) {
            creep.memory.onDeathEffect = true;
        }
        if(creep.store.getUsedCapacity() !== 0 ){
            let target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            if(!target && creep.store.getUsedCapacity() !== creep.store[RESOURCE_ENERGY]) {
                let storages = creep.room.find(FIND_STRUCTURES, {
                    filter : (structure) => structure.structureType === STRUCTURE_STORAGE
                });
                if(storages && storages.length > 0) {
                    target = storages[0];
                }
            }
            if(!target) {
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_EXTENSION ||
                            structure.structureType === STRUCTURE_SPAWN ||
                            (structure.structureType === STRUCTURE_TOWER && ((structure.energyCapacity-structure.energy) >= 100) && (structure.room.energyAvailable >= 700))) && structure.energyCapacity > structure.energy;
                    }
                });
            }
            if(!target) {
                let targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                        && Memory.structures['id'+structure.id]
                        && Memory.structures['id'+structure.id].containerType === 'Request'
                        && structure.store.getFreeCapacity() !== 0
                });
                if(targets && targets.length > 0) {
                    //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                    let min = 99999;
                    for(let i in targets) {
                        if (targets[i].store.getUsedCapacity() < min) {
                            min = targets[i].store.getUsedCapacity();
                            target = targets[i];
                        }
                    }
                }
                else {
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+structure.id]
                            && Memory.structures['id'+structure.id].containerType !== 'Harvest'
                            && Memory.structures['id'+structure.id].containerType !== 'Provider'
                    });
                    if(targets && targets.length > 0) {
                        //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                        let min = -1;
                        for(let i in targets) {
                            if (targets[i].store.getUsedCapacity() < min) {
                                min = targets[i].store.getUsedCapacity();
                                target = targets[i];
                            }
                        }
                    }
                }
            }
            if(target) {
                creep.memory.target = target.id;
                if(creep.pos.getRangeTo(target) > 1) {
                    //if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    //creep.moveTo(target);
                    pathfinding.modMoveTo(creep, target.pos, 1)
                    //console.log('---courier|not in range to put');
                }
                let resourceType = RESOURCE_ENERGY;
                for(let res in creep.store) {
                    if(res !== RESOURCE_ENERGY) {
                        resourceType = res;
                        break;
                    }
                }
                let result = creep.transfer(target, resourceType);
                if(result !== ERR_NOT_IN_RANGE) {
                    // console.log('---courier '+creep.id+' |put success ' + result);
                    creep.memory.target = undefined;
                }
                else {
                    // console.log('---courier '+creep.id+' |error ' + result);
                }

            }
            else {
                // creep.moveTo(Game.flags.IdleFlag);
                let IdleFlag = undefined;
                if(creep.room.memory.IdleFlag) {
                    IdleFlag = Game.getObjectById(creep.room.memory.IdleFlag);
                }
                if(!IdleFlag) {
                    let flags = creep.room.find(FIND_FLAGS, {
                        filter : (flag) => flag.color === COLOR_YELLOW
                    });
                    if(flags && flags.length > 0) {
                        IdleFlag = flags[0];
                        creep.room.memory.IdleFlag = IdleFlag.id;
                    }
                }
                if(IdleFlag) {
                    pathfinding.modMoveTo(creep, IdleFlag.pos, 1);
                }
                creep.memory.target = undefined;
            }
        }
        else {
            // var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            //     filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
            //         && Memory.structures['id'+structure.id]
            //         && Memory.structures['id'+structure.id].containerType === 'Harvest'
            //         && structure.store.getUsedCapacity() >= creep.store.getFreeCapacity()
            // });
            let target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            if(!target) {
                let targets = creep.room.find(FIND_TOMBSTONES, {
                    filter: (tomb) => tomb.store.getUsedCapacity() !== tomb.store[RESOURCE_ENERGY]
                });
                if(targets && targets.length > 0 && creep.room.find(FIND_HOSTILE_CREEPS).length === 0) {
                    target = targets[0];
                }
                else {
                    targets = creep.room.find(FIND_DROPPED_RESOURCES, {
                        filter: (res) => res.resourceType !== RESOURCE_ENERGY
                    });
                    if(targets && targets.length > 0 && creep.room.find(FIND_HOSTILE_CREEPS).length === 0) {
                        target = targets[0];
                    }
                }
                if(!target) {
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+structure.id]
                            && (Memory.structures['id'+structure.id].containerType === 'Harvest'
                                || Memory.structures['id'+structure.id].containerType === 'Provider')
                            && (structure.store.getUsedCapacity() - ((Memory.structures['id'+structure.id].requested) ? Memory.structures['id'+structure.id].requested : 0)) >= creep.store.getFreeCapacity()
                    });
                    if(targets && targets.length > 0) {
                        //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                        let max = -1;
                        for(let i in targets) {
                            let requested = (Memory.structures['id'+targets[i].id].requested) ? Memory.structures['id'+targets[i].id].requested : 0;
                            if ((targets[i].store.getUsedCapacity() - requested) > max) {
                                max = targets[i].store.getUsedCapacity();
                                target = targets[i];
                            }
                        }
                    }
                }

            }
            if(target) {
                creep.memory.target = target.id;
                //let result = creep.withdraw(target, RESOURCE_ENERGY);
                if(creep.pos.getRangeTo(target) > 1) {
                    // if(result === ERR_NOT_IN_RANGE) {
                    // if(creep.ticksToLive < 3) {
                    //     if(!Memory['onDeath'+creep.id]) {
                    //         if(creep.memory.requested && creep.memory.requested > 0 && Memory.structures['id'+target.id].requested) {
                    //             Memory.structures['id'+target.id].requested -= creep.memory.requested;
                    //             creep.memory.requested = 0;
                    //             Memory['onDeath'+creep.id] = Game.time;
                    //             console.log('Courier dead effect ' + creep.id);
                    //         }
                    //     }
                    //
                    // }
                    // else {
                    // console.log('+++courier '+creep.id+' |not in range to get');
                    // creep.moveTo(target);
                    pathfinding.modMoveTo(creep, target.pos, 1);
                    if(target instanceof Structure && !creep.memory.requested || creep.memory.requested === 0) {
                        creep.memory.requested = creep.store.getCapacity();
                        if(!Memory.structures['id'+target.id].requested) {
                            Memory.structures['id'+target.id].requested = 0;
                        }
                        Memory.structures['id'+target.id].requested += creep.store.getCapacity();
                    }
                    // }

                }
                let resourceType = RESOURCE_ENERGY;

                //console.log('2222 ' + JSON.stringify(target.store));
                if(target instanceof Tombstone) {
                    let resourceType = RESOURCE_ENERGY;
                    for(let res in target.store) {
                        console.log('TOMBSTONE ' + res);
                        if(res !== RESOURCE_ENERGY) {
                            resourceType = res;
                            break;
                        }
                    }
                }
                else {
                    resourceType = (target instanceof Resource) ? target.resourceType : RESOURCE_ENERGY;
                }
                // console.log('RESOURCE: ' + resourceType);
                let result = undefined;

                if(target instanceof Resource) {
                    result = creep.pickup(target);
                }
                else {
                    result = creep.withdraw(target, resourceType);
                }
                //console.log('4444 ' + result);
                if(result === OK) {
                    // console.log('+++courier '+creep.id+' |get success ' + result);

                    Memory.structures['id'+target.id].requested -= creep.memory.requested;
                    creep.memory.requested = 0;
                    creep.memory.target = undefined;

                }
                else {
                    // console.log('+++courier '+creep.id+' |get error ' + result);
                }
            }
            else {
                // creep.moveTo(Game.flags.IdleFlag);
                let IdleFlag = undefined;
                if(creep.room.memory.IdleFlag) {
                    IdleFlag = Game.getObjectById(creep.room.memory.IdleFlag);
                }
                if(!IdleFlag) {
                    let flags = creep.room.find(FIND_FLAGS, {
                        filter : (flag) => flag.color === COLOR_YELLOW
                    });
                    if(flags && flags.length > 0) {
                        IdleFlag = flags[0];
                        creep.room.memory.IdleFlag = IdleFlag.id;
                    }
                }
                if(IdleFlag) {
                    pathfinding.modMoveTo(creep, IdleFlag.pos, 1);
                }
                creep.memory.target = undefined;
            }
        }
    },

    processOnDeathEffect : function(creepName) {
        if(Memory.creeps[creepName].target && Memory.creeps[creepName].requested > 0 && Memory.structures['id'+Memory.creeps[creepName].target]) {
            // console.log(Memory.creeps[creepName].target);
            Memory.structures['id'+Memory.creeps[creepName].target].requested -= Memory.creeps[creepName].requested;
            Memory.creeps[creepName].requested = 0;
            console.log('courier OnDeath effect ' + creepName);
        }

    }

};

module.exports = roleCourierLvl3;