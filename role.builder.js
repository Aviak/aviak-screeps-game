var pathfinding = require('pathfinding');

let roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.store.getUsedCapacity() === 0) {
            creep.memory.building = false;
            creep.memory.target = undefined;
            //creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() === 0) {
            creep.memory.building = true;
            //creep.say('🚧 build');
        }

        if(creep.memory.building) {
            let target = undefined;
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
                    if(creep.pos.getRangeTo(target) > 3) {
                        pathfinding.modMoveTo(creep, target.pos, 3);
                    }
                    creep.repair(target);
                }
            }
            else {
                let targets = creep.room.find(FIND_STRUCTURES, {
                    filter: function (object) {
                        return ((object.hits < object.hitsMax) && (object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART));
                    }
                });
                //console.log(targets)
                let minHits = 2;
                for (let s of targets) {
                    let pathfind = PathFinder.search(creep.pos, s.pos);
                    if(pathfind === undefined || pathfind.incomplete === true) {
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
                    // if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                    //     creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    // }
                    if(creep.pos.getRangeTo(target) > 3) {
                        pathfinding.modMoveTo(creep, target.pos, 3);
                    }
                    creep.repair(target);
                    creep.memory.target = target.id;

                } else { console.log('no walls found wut')}
            }

        }
        else {
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
    },

    processOnDeathEffect : function(creepName) {
        if(Memory.creeps[creepName].sourceId) {
            // console.log(Memory.creeps[creepName].target);
            Memory.structures['id'+Memory.creeps[creepName].sourceId].creeps--;
            //Memory.creeps[creepName].requested = 0;
            console.log('builder worker OnDeath effect ' + creepName);
        }

    }
};


module.exports = roleBuilder;