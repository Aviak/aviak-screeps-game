var roleCourierLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getUsedCapacity() !== 0 ){
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                }
            });
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
                            target = i;
                        }
                    }
                }
                else {
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+structure.id]
                            && Memory.structures['id'+structure.id].containerType !== 'Harvest'
                            && structure.store.getFreeCapacity() !== 0
                    });
                    if(targets && targets.length > 0) {
                        //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                        let min = -1;
                        for(let i in targets) {
                            if (targets[i].store.getUsedCapacity() < min) {
                                min = targets[i].store.getUsedCapacity();
                                target = i;
                            }
                        }
                    }
                }
            }
            if(target) {
                if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else {
                creep.moveTo(Game.flags.IdleFlag);
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
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                        && Memory.structures['id'+structure.id]
                        && Memory.structures['id'+structure.id].containerType === 'Harvest'
                        && structure.store.getUsedCapacity() >= creep.store.getFreeCapacity()
            });
            if(targets && targets.length > 0) {
                //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                let max = -1;
                for(let i in targets) {
                    if (targets[i].store.getUsedCapacity() > max) {
                        max = targets[i].store.getUsedCapacity();
                        target = targets[i];
                    }
                }
            }
            if(target) {
                if(creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else {
                creep.moveTo(Game.flags.IdleFlag);
            }
        }
    }
};

module.exports = roleCourierLvl3;