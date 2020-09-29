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
                creep.memory.longDistanceMining.position = undefined;
                if(!creep.memory.longDistanceMining.position) {
                    let structuresNearSource = creep.room.lookForAtArea(LOOK_STRUCTURES, source.pos.y-2, source.pos.x-2, source.pos.y+2, source.pos.x-2, true);
                    let containers = _.filter(structuresNearSource, (structure)=>structure.structureType === STRUCTURE_CONTAINER);
                    if(containers && containers.length > 0) {
                        let container = containers[0];
                        for(let i=-1; i<=1 && !creep.memory.longDistanceMining.position; i++) {
                            for(let j=-1; j<=1 && !creep.memory.longDistanceMining.position; j++) {
                                let currentPosition = new RoomPosition(container.pos.x+i, container.pos.y+j, container.pos.roomName);
                                if(currentPosition.getRangeTo(container.pos) === 1 && currentPosition.getRangeTo(source.pos) === 1) {
                                    creep.memory.longDistanceMining.position = {x : currentPosition.pos.x, y : currentPosition.pos.y};
                                }
                            }
                        }
                    }
                    else {
                        creep.memory.longDistanceMining.position = {x : -1, y : -1};
                    }
                }
                if(creep.memory.longDistanceMining.position) {
                    let targetPosition = undefined;
                    if(creep.memory.longDistanceMining.positionx.x === -1) {
                        if(creep.pos.getRangeTo(source) > 1) {
                            pathfinding.modMoveTo(creep, source.pos, 1);
                        }
                        else {
                            let containerPosition = undefined;
                            for(let i=-1; i<=1 && !containerPosition; i++) {
                                for(let j=-1; j<=1 && !containerPosition; j++) {
                                    if(i===0 && j===0) {
                                        continue;
                                    }

                                    let roomTerrain = creep.room.getTerrain();
                                    if(roomTerrain.get(creep.pos.x+i, creep.pos.y+j) === TERRAIN_MASK_WALL) {
                                        continue;
                                    }
                                    containerPosition = new RoomPosition(creep.pos.x+i, creep.pos.y+j, creep.pos.roomName);
                                    let res = creep.room.createConstructionSite(containerPosition, STRUCTURE_CONTAINER);
                                    if(res !== OK && res !== ERR_RCL_NOT_ENOUGH) {
                                        console.log('res ' + res + ' i='+i + ' j='+j + ' ' + (res !== ERR_RCL_NOT_ENOUGH) + ' ' + ERR_RCL_NOT_ENOUGH);
                                        containerPosition = undefined;
                                    }
                                }
                            }
                            creep.memory.longDistanceMining.position = undefined;
                            for(let i=-1; i<=1 && !creep.memory.longDistanceMining.position; i++) {
                                for(let j=-1; j<=1 && !creep.memory.longDistanceMining.position; j++) {
                                    let currentPosition = new RoomPosition(containerPosition.x+i, containerPosition.y+j, containerPosition.roomName);
                                    if(currentPosition.getRangeTo(containerPosition) === 1 && currentPosition.getRangeTo(source.pos) === 1) {
                                        creep.memory.longDistanceMining.position = {x : currentPosition.pos.x, y : currentPosition.pos.y};
                                    }
                                }
                            }
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
                                let constructionSitesNear = creep.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, creep.pos.y-3, creep.pos.x-3, creep.pos.y+3, creep.pos.x+3, true);
                                //console.log(JSON.stringify(constructionSitesNear[0]));
                                if(constructionSitesNear && constructionSitesNear.length > 0) {
                                    let res = creep.build(constructionSitesNear[0]);
                                    console.log('build res ' + res);
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