var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.carry.energy === 0) {
            creep.memory.building = false;
            creep.memory.target = undefined;
            //creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy === creep.carryCapacity) {
            creep.memory.building = true;
            //creep.say('🚧 build');
        }

        if(creep.memory.building) {
            var target = undefined;
            if(creep.memory.target !== undefined) {
                target = Game.getObjectById(creep.memory.target);
                if(!target || (target instanceof Structure && target.hits === target.hitsMax)) {
                    target = undefined;
                    creep.memory.target = undefined;
                }
            }
            if(creep.memory.target === undefined){
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
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    creep.memory.target = target.id;

                } else { console.log('no walls found wut')}
            }

        }
        else {
            let source = Game.getObjectById('5bbcadb09099fc012e637a3e');
            if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};


module.exports = roleBuilder;