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
            }
        }
        if(creep.hits<creep.hitsMax && creep.hits>0 && creep.room.name !== creep.memory.roomOrigin) {
            if(!Memory.dangerRooms) {
                Memory.dangerRooms = {};
            }
            Memory.dangerRooms[creep.room.name] = Game.time;
        }
        //MOVING TO SOURCE IN TARGET ROOM
        if(creep.room.name === creep.memory.longDistanceMining.room) {
            let SpawnConstructionSite = undefined;
            if(creep.room.controller.my) {
                let spawnConstructionSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
                    filter : (c)=>c.structureType === STRUCTURE_SPAWN
                });
                if(spawnConstructionSites && spawnConstructionSites.length > 0) {
                    SpawnConstructionSite = spawnConstructionSites[0];
                }
            }
            if(!creep.memory.longDistanceMining.enterPos) {
                creep.memory.longDistanceMining.enterPos = { x : creep.pos.x, y : creep.pos.y};
            }
            let source = undefined;
            if(creep.memory.longDistanceMining.sourceId === undefined) {
                let sources = creep.room.find(FIND_SOURCES, {
                    filter : (source) => !Memory.structures['id'+source.id]
                        || !Memory.structures['id'+source.id].miner
                        || !Game.getObjectById(Memory.structures['id'+source.id].miner)
                        || Game.getObjectById(Memory.structures['id'+source.id].miner).ticksToLive < (Game.getObjectById(Memory.structures['id'+source.id].miner).memory.ticksBeforeWork)
                });
                if(sources && sources.length > 0) {
                    source = sources[0];
                    creep.memory.longDistanceMining.sourceId = source.id;
                    if(!Memory.structures['id'+source.id]) {
                        Memory.structures['id'+source.id] = {};
                    }
                    if(!Memory.structures['id'+source.id].miner || !Game.getObjectById(Memory.structures['id'+source.id].miner)) {
                        Memory.structures['id'+source.id].miner = creep.id;
                    }
                }
            }
            else {
                source = Game.getObjectById(creep.memory.longDistanceMining.sourceId);
                if(!Memory.structures['id'+source.id]) {
                    Memory.structures['id'+source.id] = {};
                }
                if(!Memory.structures['id'+source.id].miner || !Game.getObjectById(Memory.structures['id'+source.id].miner)) {
                    Memory.structures['id'+source.id].miner = creep.id;
                }
            }
            if(source && source instanceof Source) {
                // creep.memory.longDistanceMining.position = undefined;
                if(!creep.memory.longDistanceMining.position) {
                    let structuresNearSource = creep.room.lookForAtArea(LOOK_STRUCTURES, source.pos.y-2, source.pos.x-2, source.pos.y+2, source.pos.x-2, true);
                    let containers = _.filter(structuresNearSource, (structure)=>structure.structure.structureType === STRUCTURE_CONTAINER);
                    if(containers && containers.length > 0) {
                        let container = containers[0].structure;
                        for(let i=-1; i<=1 && !creep.memory.longDistanceMining.position; i++) {
                            for(let j=-1; j<=1 && !creep.memory.longDistanceMining.position; j++) {
                                let roomTerrain = creep.room.getTerrain();
                                if(roomTerrain.get(container.pos.x+i, container.pos.y+j) === TERRAIN_MASK_WALL) {
                                    continue;
                                }
                                let currentPosition = new RoomPosition(container.pos.x+i, container.pos.y+j, container.pos.roomName);
                                if(currentPosition.getRangeTo(container.pos) === 1 && currentPosition.getRangeTo(source.pos) === 1) {
                                    creep.memory.longDistanceMining.position = {x : currentPosition.x, y : currentPosition.y};
                                }
                            }
                        }
                    }
                    else {
                        creep.memory.longDistanceMining.position = {x : -1, y : -1};
                    }
                }
                if (!SpawnConstructionSite || !((creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity()-10 && creep.pos.getRangeTo(SpawnConstructionSite)>3) || (creep.pos.getRangeTo(SpawnConstructionSite)<=3 && creep.store[RESOURCE_ENERGY]>0))) {
                    if(creep.memory.longDistanceMining.position) {
                        let targetPosition = undefined;
                        if(creep.memory.longDistanceMining.position.x === -1) {
                            if(creep.pos.getRangeTo(source) > 1) {
                                pathfinding.modMoveTo(creep, source.pos, 1);
                            }
                            else {
                                let containerPosition = undefined;
                                let minRange = Number.MAX_VALUE;
                                let enterPos = new RoomPosition(creep.memory.longDistanceMining.enterPos.x, creep.memory.longDistanceMining.enterPos.y, creep.room.name);
                                for(let i=-1; i<=1 && !containerPosition; i++) {
                                    for(let j=-1; j<=1 && !containerPosition; j++) {
                                        if(i===0 && j===0) {
                                            continue;
                                        }

                                        let roomTerrain = creep.room.getTerrain();
                                        if(roomTerrain.get(creep.pos.x+i, creep.pos.y+j) === TERRAIN_MASK_WALL) {
                                            continue;
                                        }
                                        let newContainerPosition = new RoomPosition(creep.pos.x+i, creep.pos.y+j, creep.pos.roomName);
                                        let range = newContainerPosition.getRangeTo(enterPos);
                                        if(range < minRange ) {
                                            containerPosition = newContainerPosition;
                                            minRange = range;
                                        }
                                        // let res = creep.room.createConstructionSite(containerPosition, STRUCTURE_CONTAINER);
                                        // if(res !== OK && res !== ERR_RCL_NOT_ENOUGH) {
                                        //     // console.log('res ' + res + ' i='+i + ' j='+j + ' ' + (res !== ERR_RCL_NOT_ENOUGH) + ' ' + ERR_RCL_NOT_ENOUGH);
                                        //     containerPosition = undefined;
                                        // }
                                    }
                                }
                                creep.room.createConstructionSite(containerPosition, STRUCTURE_CONTAINER);
                                creep.memory.longDistanceMining.position = undefined;
                                // console.log('---'+JSON.stringify(containerPosition)+' ---- \n'+JSON.stringify(source.pos));
                                for(let i=-1; i<=1 && !creep.memory.longDistanceMining.position; i++) {
                                    for(let j=-1; j<=1 && !creep.memory.longDistanceMining.position; j++) {
                                        let roomTerrain = creep.room.getTerrain();
                                        if(roomTerrain.get(containerPosition.x+i, containerPosition.y+j) === TERRAIN_MASK_WALL) {
                                            continue;
                                        }
                                        let currentPosition = new RoomPosition(containerPosition.x+i, containerPosition.y+j, containerPosition.roomName);
                                        if(currentPosition.getRangeTo(containerPosition) === 1 && currentPosition.getRangeTo(source.pos) === 1) {
                                            // console.log('FOUND 1 ' + JSON.stringify(currentPosition));
                                            creep.memory.longDistanceMining.position = {x : currentPosition.x, y : currentPosition.y};
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


                        if (targetPosition && targetPosition.isEqualTo(creep.pos)) {
                            //MINING & MAINTAINING MINING SITE
                            let numberOfWorkParts = 0;
                            if (!creep.memory.numberOfWorkParts) {
                                numberOfWorkParts = (_.filter(creep.body, (el) => el.type === WORK)).length;
                                creep.memory.numberOfWorkParts = numberOfWorkParts;
                            }
                            else {
                                numberOfWorkParts = creep.memory.numberOfWorkParts;
                            }
                            if (creep.store.getUsedCapacity() < numberOfWorkParts || SpawnConstructionSite) {
                                let res = creep.harvest(source);
                                if (res === OK) {
                                    if (!creep.memory.ticksBeforeWork && creep.memory.timeBorn) {
                                        creep.memory.ticksBeforeWork = Game.time - creep.memory.timeBorn;
                                    }
                                }
                            }
                            else {
                                // let structuresNear = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y-3, creep.pos.x-3, creep.pos.y+3, creep.pos.x+3, true);
                                // let structuresToRepair = _.filter(structuresNear, (structure) => (numberOfWorkParts*100) < (structure.structure.hitsMax - structure.structure.hits));
                                // if(structuresToRepair && structuresToRepair.length > 0) {
                                //     creep.repair(structuresToRepair[0].structure);
                                // }
                                let container = undefined;
                                if (!creep.memory.longDistanceMining.containerId) {
                                    let structures = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true);
                                    // console.log('s ' + structures.length);
                                    let containers = _.filter(structures, (s) => s.structure.structureType === STRUCTURE_CONTAINER);
                                    // console.log('c ' + containers.length);
                                    if (containers && containers.length > 0) {
                                        container = containers[0].structure;
                                        creep.memory.longDistanceMining.containerId = container.id;
                                    }
                                }
                                else {
                                    container = Game.getObjectById(creep.memory.longDistanceMining.containerId);
                                }

                                if (container && ((numberOfWorkParts * 100) < (container.hitsMax - container.hits))) {
                                    creep.repair(container);
                                }
                                else {
                                    if (creep.store.getUsedCapacity() < numberOfWorkParts * 5 && creep.store.getFreeCapacity() >= numberOfWorkParts * 2) {
                                        let res = creep.harvest(source);
                                        if (res === OK) {
                                            if (!creep.memory.ticksBeforeWork && creep.memory.timeBorn) {
                                                creep.memory.ticksBeforeWork = Game.time - creep.memory.timeBorn;
                                            }
                                        }
                                    }
                                    else {
                                        let constructionSitesNear = creep.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, creep.pos.y - 3, creep.pos.x - 3, creep.pos.y + 3, creep.pos.x + 3, true);
                                        //console.log(JSON.stringify(constructionSitesNear[0]));
                                        if (constructionSitesNear && constructionSitesNear.length > 0) {
                                            let res = creep.build(constructionSitesNear[0].constructionSite);

                                            // console.log('build res ' + res + ' ' + JSON.stringify(constructionSitesNear[0]));
                                        }
                                        else {
                                            if (creep.store.getFreeCapacity() < numberOfWorkParts * 2) {
                                                let container = undefined;
                                                if (!creep.memory.longDistanceMining.containerId) {
                                                    let structures = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true);
                                                    // console.log('s ' + structures.length);
                                                    let containers = _.filter(structures, (s) => s.structure.structureType === STRUCTURE_CONTAINER);
                                                    // console.log('c ' + containers.length);
                                                    if (containers && containers.length > 0) {
                                                        container = containers[0].structure;
                                                        creep.memory.longDistanceMining.containerId = container.id;
                                                    }
                                                }
                                                else {
                                                    container = Game.getObjectById(creep.memory.longDistanceMining.containerId);
                                                }
                                                creep.transfer(container, RESOURCE_ENERGY);
                                            }
                                            if (creep.store.getFreeCapacity() > 0) {
                                                let res = creep.harvest(source);
                                                if (res === OK) {
                                                    if (!creep.memory.ticksBeforeWork && creep.memory.timeBorn) {
                                                        creep.memory.ticksBeforeWork = Game.time - creep.memory.timeBorn;
                                                    }
                                                }
                                            }

                                        }
                                    }

                                }

                            }


                        }
                    }
                }

                else {
                    if (creep.pos.getRangeTo(SpawnConstructionSite) > 3) {
                        creep.moveTo(SpawnConstructionSite);
                    }
                    creep.build(SpawnConstructionSite);
                }
            }
        }
        //MOVING TO TARGET ROOM
        else if (creep.room.name !== creep.memory.longDistanceMining.room) {
            if(!creep.memory.longDistanceMining.exitToMining) {
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
            }
            else {
                let exitToMining = new RoomPosition(creep.memory.longDistanceMining.exitToMining.x, creep.memory.longDistanceMining.exitToMining.y, creep.room.name);

                creep.moveTo(exitToMining);
            }

        }
    }
    ,
    getMiningLocations: function (room) {
        const MiningLocations = [   { originRoom : 'E7S53', room: 'E7S54', x: 42, y: 11, maxMiners: 1 },
            { originRoom : 'E7S53', room: 'E7S52', x: 8, y: 20, maxMiners: 0 },
            { originRoom : 'E7S53', room: 'E7S52', x: 31, y: 19, maxMiners: 0 },
            { originRoom : 'E7S53', room: 'E6S53', x: 39, y: 18, maxMiners: 1 }];
        let locations = _.filter(MiningLocations, (l)=>l.originRoom === room.name);

        // let cpu = Game.cpu.getUsed();
        let assignedMiners = _.filter(Memory.creeps, (elem) => elem.role === 'longdistanceminer5' && elem.longDistanceMining !== undefined && Game.creeps[_.findKey(Memory.creeps, elem)]!==undefined && (!elem.ticksBeforeWork || Game.creeps[elem.name].ticksToLive >= (elem.ticksBeforeWork)));
        // console.log('used cpu: ' + (Game.cpu.getUsed() - cpu));

        for (let l of locations) {

            let minersInLocation = _.filter(assignedMiners, (elem) => elem.longDistanceMining.room === l.room);
            l.maxMiners -= minersInLocation.length;

        }

        return locations;
    }
    ,
    countUnassignedMiners: function (room) {
        let unassignedMiners = _.filter(Memory.creeps, (elem) => elem.role === 'longdistanceminer5' && elem.longDistanceMining === undefined && elem.originRoom === room.name && Game.creeps[elem.name]!==undefined);
        return unassignedMiners.length;
    }
};


module.exports = roleLongDistanceMinerLvl5;