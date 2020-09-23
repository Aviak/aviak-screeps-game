var roleBuilderLvl3 = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.store.getUsedCapacity() === 0) {
            creep.memory.building = false;
            creep.memory.target = undefined;
        }

        if(!creep.memory.building) {
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
                creep.memory.building = true;
            }
        }
        if(creep.memory.building) {
            var target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
                if(!target || (target instanceof Structure && target.hits === target.hitsMax)) {
                    target = undefined;
                    creep.memory.target = undefined;
                }
            }
            if(!creep.memory.target){
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
                //console.log(creep.name + " " + JSON.stringify(target));
                creep.memory.target = target.id;
                if(target instanceof ConstructionSite) {
                    if(creep.build(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
                else {
                    if(creep.repair(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: function (object) {
                        return ((object.hits < object.hitsMax) && (object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART));
                    }
                });
                //console.log(targets)
                var minHits = 2;
                for (let s of targets) {
                    let pathfinding = PathFinder.search(creep.pos, s.pos);
                    if(pathfinding === undefined || pathfinding.incomplete === true) {
                        continue;
                    }

                    //console.log(s.hits / s.hitsMax);
                    if ((s.hits / s.hitsMax) < minHits) {
                        minHits = s.hits / s.hitsMax;
                        target = s;
                    }
                    if (s.hits < 10000) {
                        minHits = -1;
                        target = s;
                        break;
                    }
                }
                if (target) {
                    //console.log(creep + " is repairing");
                    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    creep.memory.target = target.id;

                } else { console.log('no walls found wut')}
            }
        }
    }
};

module.exports = roleBuilderLvl3;