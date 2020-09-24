var roleCourierLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getUsedCapacity() !== 0 ){
            var target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            if(!target) {
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_EXTENSION ||
                            structure.structureType === STRUCTURE_SPAWN ||
                            structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
                });
            }
            if(!target) {
                var targets = creep.room.find(FIND_STRUCTURES, {
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
                if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                } else {
                    creep.memory.target = undefined;
                }
            }
            else {
                creep.moveTo(Game.flags.IdleFlag);
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
            var target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            if(!target) {
                var targets = creep.room.find(FIND_STRUCTURES, {
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
            if(target) {
                creep.memory.target = target.id;
                if(creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    if(creep.ticksToLive < 2 && !Memory['onDeath'+creep.id]) {
                        if(creep.memory.requested && creep.memory.requested > 0 && Memory.structures['id'+target.id].requested) {
                            Memory.structures['id'+target.id].requested -= creep.memory.requested;
                            creep.memory.requested = 0;
                            Memory['onDeath'+creep.id] = Game.time;
                        }
                    }
                    else {
                        creep.moveTo(target);
                        if(!creep.memory.requested || creep.memory.requested === 0) {
                            creep.memory.requested = creep.store.getCapacity();
                            if(!Memory.structures['id'+target.id].requested) {
                                Memory.structures['id'+target.id].requested = 0;
                            }
                            Memory.structures['id'+target.id].requested += creep.store.getCapacity();
                        }
                    }

                } else {
                    Memory.structures['id'+target.id].requested -= creep.memory.requested;
                    creep.memory.requested = 0;
                    creep.memory.target = undefined;
                }
            }
            else {
                creep.moveTo(Game.flags.IdleFlag);
                creep.memory.target = undefined;
            }
        }
    }
};

module.exports = roleCourierLvl3;