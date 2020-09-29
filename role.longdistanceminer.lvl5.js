var pathfinding = require('pathfinding');

var roleLongDistanceMinerLvl5 = {

    /** @param {Creep} creep **/
    run: function (creep) {

        //INITIALIZATION
        if (!creep.memory.longDistanceMining) {
            creep.memory.longDistanceMining = {};
            let miningLocations = _.filter(this.getMiningLocations(Game.rooms[creep.memory.roomOrigin]), (elem) => elem.maxMiners > 0);

            if (miningLocations.length > 0) {
                let location = _.first(miningLocations);
                creep.memory.longDistanceMining.room = location.room;

                if (creep.room.name !== location.room) {
                    let exitCode = creep.room.findExitTo(location.room);
                    let exitPos = creep.pos.findClosestByPath(exitCode, {ignoreCreeps: true});
                    if (!exitPos) {
                        creep.memory.longDistanceMining = undefined;
                        return;
                    }
                    creep.memory.longDistanceMining.exitToMining = { x: exitPos.x, y: exitPos.y};
                }
            } else {
                creep.moveTo(Game.flags.idleFlag)
            }
        }

        //MOVING TO SOURCE IN TARGET ROOM
        if(creep.room.name === creep.memory.longDistanceMining.room) {
            let source = undefined;
            if(creep.memory.longDistanceMining.sourceId === undefined) {
                let sources = creep.room.find(FIND_SOURCES, {
                    filter : (source) => !Memory.structures['id'+source.id]
                        || !Memory.structures['id'+source.id].miner
                        || Game.getObjectById(Memory.structures['id'+source.id].miner).ticksToLive < Game.getObjectById(Memory.structures['id'+source.id].miner).memory.ticksBeforeWork
                });
                if(sources && sources.length > 0) {
                    source = sources[0];
                    creep.memory.longDistanceMining.sourceId = source.id;
                }
            }
            else {
                source = Game.getObjectById(creep.memory.longDistanceMining.sourceId);
            }
            if(source && source instanceof Source) {
                if(!creep.memory.longDistanceMining.position) {
                    let structuresNearSource = creep.room.lookForAtArea(LOOK_STRUCTURES, source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x-1, true);
                    let containers = _.filter(structuresNearSource, (structure)=>structure.structureType === STRUCTURE_CONTAINER);
                    if(containers && containers.length > 0) {
                        let container = containers[0];
                        creep.memory.longDistanceMining.position = {x : container.pos.x, y : container.pos.y};
                    }
                    else {
                        creep.memory.longDistanceMining.position = {x : -1, y : -1};
                    }
                }
                if(creep.memory.longDistanceMining.position) {
                    let targetPosition = undefined;
                    if(creep.memory.longDistanceMining.position.x === -1) {
                        if(creep.pos.getRangeTo(source) > 1) {
                            pathfinding.modMoveTo(creep, source.pos, 1);
                        }
                        else {
                            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                            creep.memory.longDistanceMining.position = {x : creep.pos.x, y : creep.pos.y};
                            targetPosition = new RoomPosition(creep.memory.longDistanceMining.position.x, creep.memory.longDistanceMining.position.y, creep.room.name);
                        }
                    }
                    else {
                        targetPosition = new RoomPosition(creep.memory.longDistanceMining.position.x, creep.memory.longDistanceMining.position.y, creep.room.name);
                        if(creep.pos.getRangeTo(targetPosition) > 0) {
                            pathfinding.modMoveTo(creep, targetPosition, 0);
                        }
                    }
                    if(targetPosition && targetPosition.isEqualTo(creep.pos)) {
                        //MINING & MAINTAINING MINING SITE
                        let numberOfWorkParts = 0;
                        if(!creep.memory.numberOfWorkParts) {
                            numberOfWorkParts = (_.filter(creep.body, (el) => el.type === WORK)).length;
                            creep.memory.numberOfWorkParts = numberOfWorkParts;
                        }
                        else {
                            numberOfWorkParts = creep.memory.numberOfWorkParts;
                        }
                        if(creep.store.getUsedCapacity() < numberOfWorkParts) {
                            creep.harvest(source);
                        }
                        else {
                            let structuresNear = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y-3, creep.pos.x-3, creep.pos.y+3, creep.pos.x+3, true);
                            let structuresToRepair = _.filter(structuresNear, (structure) => (numberOfWorkParts*100) < (structure.hitsMax - structure.hits));
                            if(structuresToRepair && structuresToRepair.length > 0) {
                                creep.repair(structuresToRepair[0]);
                            }
                            else {
                                if(creep.store.getFreeCapacity() < numberOfWorkParts*2) {
                                    creep.drop(RESOURCE_ENERGY);
                                }
                                creep.harvest(source);
                            }
                        }
                    }
                }
            }
        }
        //MOVING TO TARGET ROOM
        else if (creep.room.name !== creep.memory.longDistanceMining.room) {
            let exitToMining = new RoomPosition(creep.memory.longDistanceMining.exitToMining.x, creep.memory.longDistanceMining.exitToMining.y, creep.room.name);

            creep.moveTo(exitToMining);
        }
    }
    ,
    getMiningLocations: function (room) {
        const MiningLocations = [   { originRoom : 'E13N2', room: 'E13N3', maxMiners: 1 }];
        let locations = _.filter(MiningLocations, (l)=>l.originRoom === room.name);

        let assignedMiners = _.filter(Memory.creeps, (elem) => elem.longDistanceMining !== undefined && elem.role === 'longdistanceminer5');

        for (let l of locations) {

            let minersInLocation = _.filter(assignedMiners, (elem) => elem.longDistanceMining.room === l.room);
            l.maxMiners -= minersInLocation.length;

        }

        return locations;
    }
};


module.exports = roleLongDistanceMinerLvl5;