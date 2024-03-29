var pathfinding = require('pathfinding');

var roleBuilderLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.store.getUsedCapacity() === 0) {
            creep.memory.building = false;
            creep.memory.target = undefined;
        }

        //console.log('b0');
        if(!creep.memory.building) {
            //console.log('b1');
            let targetContainer = creep.pos.findClosestByPath(FIND_STRUCTURES,{
                filter: (structure) => structure.structureType === STRUCTURE_CONTAINER
                    && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                    && Memory.structures['id'+structure.id]
                    && (Memory.structures['id'+structure.id].containerType === 'Request'
                        || (Memory.structures['id'+structure.id].containerType === 'Harvest' && structure.store[RESOURCE_ENERGY] >= 1000)
                        || (Memory.structures['id'+structure.id].containerType === 'Provider' && structure.store[RESOURCE_ENERGY] >= 1000))
            });
            if(!targetContainer) {

                targetContainer =  creep.pos.findClosestByPath(FIND_STRUCTURES,{
                    filter: (structure) => (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE)
                            && structure.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                });


            }
            if(targetContainer) {
                // if(creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                //     //creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
                //     pathfinding.modMoveTo(creep, targetContainer.pos, 1);
                // }
                if(creep.pos.getRangeTo(targetContainer) > 1) {
                    pathfinding.modMoveTo(creep, targetContainer.pos, 1);
                }
                creep.withdraw(targetContainer, RESOURCE_ENERGY);
            }
            if(creep.store.getFreeCapacity() === 0) {
                creep.memory.building = true;
            }
        }
        if(creep.memory.building) {
            //.log('b2');
            let target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
                if(!target || (target instanceof Structure && target.hits === target.hitsMax)) {
                    target = undefined;
                    creep.memory.target = undefined;
                }
            }
            if(!creep.memory.target){
                // console.log('b3');
                target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: function (object) {
                        return ((object.structureType === STRUCTURE_ROAD ? ((object.hits / object.hitsMax) < 0.80) : ((object.hits / object.hitsMax) < 0.95)) && object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART);
                    }
                });
                if(!target) {
                    let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                    if(targets.length) {
                        target = targets[0];

                    }
                }
            }
            if(target) {
                //console.log('b4');
                //console.log(creep.name + " " + JSON.stringify(target));

                creep.memory.target = target.id;
                if(target instanceof ConstructionSite) {
                    // if(creep.build(target) === ERR_NOT_IN_RANGE) {
                    //     creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    // }
                    if(creep.pos.getRangeTo(target) > 3) {
                        pathfinding.modMoveTo(creep, target.pos, 3);
                    }
                    creep.build(target);
                }
                else {
                    // if(creep.repair(target) === ERR_NOT_IN_RANGE) {
                    //     creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    // }
                    let rangeToTarget = creep.pos.getRangeTo(target);
                    if(rangeToTarget > 3) {
                        pathfinding.modMoveTo(creep, target.pos, 3);
                    }
                    else if(rangeToTarget > 2) {
                        pathfinding.modMoveTo(creep, target.pos, 2);
                    }
                    // else if(rangeToTarget > 1) {
                    //     pathfinding.modMoveTo(creep, target.pos, 1);
                    // }
                    creep.repair(target);
                }
            }
            else {
                //console.log('wall');
                let targets = creep.room.find(FIND_STRUCTURES, {
                    filter: function (object) {
                        return ((object.hits < object.hitsMax) && (object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART));
                    }
                });
                //console.log(targets)
                let minHits = Number.MAX_VALUE;
                for (let s of targets) {
                    let pathfind = PathFinder.search(creep.pos, s.pos);
                    if(pathfind === undefined || pathfind.incomplete === true) {
                        continue;
                    }

                    //console.log(s.hits / s.hitsMax);
                    if (s.hits < minHits) {
                        minHits = s.hits;
                        target = s;
                    }
                    if (s.hits < 10000) {
                        minHits = -1;
                        target = s;
                        break;
                    }
                }
                if (target) {
                    // console.log('bbbb'+JSON.stringify(target));
                    //console.log('b5');
                    //console.log(creep + " is repairing");
                    // if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                    //     creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    // }
                    if(creep.pos.getRangeTo(target) > 3) {
                        //console.log('wall rep mov ');
                        pathfinding.modMoveTo(creep, target.pos, 3);
                    }
                    let res = creep.repair(target);
                    //console.log('wall rep res ' + res);
                    creep.memory.target = target.id;

                } else { console.log('no walls found wut')}
            }
        }
    },

    processOnDeathEffect : function(creepName) {

    }


}

module.exports = roleBuilderLvl3;