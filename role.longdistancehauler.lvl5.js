let pathfinding = require('pathfinding');
//let roleLongDistanceMinerLvl5 = require('role.longdistanceminer.lvl5');

let roleLongDistanceHaulerLvl5 = {

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
                        //wait a turn
                        creep.memory.longDistanceMining = undefined;
                        return;
                    }
                    creep.memory.longDistanceMining.exitToMining = { x: exitPos.x, y: exitPos.y};
                }
            } else {
                creep.moveTo(Game.flags.idleFlag)
            }
        }

        if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            //MOVING TO CONTAINER IN TARGET ROOM
            if(creep.room.name === creep.memory.longDistanceMining.room) {
                let container = undefined;
                if(creep.memory.target) {
                    container = Game.getObjectById(creep.memory.target);
                }
                else {
                    let containers = creep.room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType === STRUCTURE_CONTAINER
                    });
                    let max = -1;
                    for(let containerIter in containers) {
                        let containerId = containers[containerIter].id;
                        let requestedAmount = (Memory.structures['id'+containerId].requested) ? Memory.structures['id'+containerId].requested : 0;
                        if((containers[containerIter].store.getUsedCapacity(RESOURCE_ENERGY) - requestedAmount) > max) {
                            max = containers[containerIter].store.getUsedCapacity(RESOURCE_ENERGY) - requestedAmount;
                            container = containers[containerIter];
                        }
                    }
                    if(container) {
                        creep.memory.target = container.id;
                    }
                }
                if(container) {
                    if(!creep.memory.requested) {
                        creep.memory.requested = 0;
                    }
                    if(creep.memory.requested === 0) {
                        creep.memory.requested = creep.store.getCapacity();
                        if(!Memory.structures['id'+container.id].requested) {
                            Memory.structures['id'+container.id].requested = 0;
                        }
                        Memory.structures['id'+container.id].requested += creep.store.getCapacity();
                    }
                    if(creep.pos.getRangeTo(container) > 1) {
                        pathfinding.modMoveTo(creep, container.pos, 1);
                    }
                    let res = creep.withdraw(container, RESOURCE_ENERGY);
                    if(res === OK) {
                        Memory.structures['id'+container.id].requested -= creep.memory.requested;
                        creep.memory.requested = 0;
                        creep.memory.target = undefined;
                    }
                }
            }
            //MOVING TO TARGET ROOM
            else if (creep.room.name !== creep.memory.longDistanceMining.room) {
                let exitToMining = new RoomPosition(creep.memory.longDistanceMining.exitToMining.x, creep.memory.longDistanceMining.exitToMining.y, creep.room.name);

                if(creep.memory.longDistanceMining.containerLocation
                    && !creep.memory.longDistanceMining.exitCheckDone
                    && creep.pos.getRangeTo(new RoomPosition(creep.memory.longDistanceMining.containerLocation.x, creep.memory.longDistanceMining.containerLocation.y, creep.room.name)) === 1
                ) {
                    let exitCode = creep.room.findExitTo(creep.memory.longDistanceMining.room);
                    let exitPos = creep.pos.findClosestByPath(exitCode, {ignoreCreeps: true});

                    if (exitPos) {
                        creep.memory.longDistanceMining.exitCheckDone = true;
                        if(!exitPos.isEqualTo(exitToMining)) {
                            exitToMining = exitPos;
                            creep.memory.longDistanceMining.exitToMining.x = exitPos.x;
                            creep.memory.longDistanceMining.exitToMining.y = exitPos.y;
                        }
                    }
                }
                pathfinding.modMoveTo(creep, exitToMining, 0);
            }
        }
        else {
            //MOVING HOME
            if (creep.room.name === creep.memory.roomOrigin) {
                let container = undefined;
                if (!creep.memory.longDistanceMining.containerLocation) {
                    container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+s.id]
                            && Memory.structures['id'+s.id].containerType === 'Provider'
                    });

                    creep.memory.longDistanceMining.containerLocation = { x: container.pos.x, y: container.pos.y, room: container.room.name };
                    creep.memory.longDistanceMining.containerId = container.id;
                }
                else {
                    container = Game.getObjectById(creep.memory.longDistanceMining.containerId);
                }

                let containerPostion = new RoomPosition(creep.memory.longDistanceMining.containerLocation.x, creep.memory.longDistanceMining.containerLocation.y, creep.room.name);
                if (creep.pos.getRangeTo(containerPostion) > 1) {
                    pathfinding.modMoveTo(creep, containerPostion, 1)
                    // if(!Memory['LongDistanceMiner'+creep.id]) {
                    //     Memory['LongDistanceMiner'+creep.id] = 0;
                    // }
                    // Memory['LongDistanceMiner'+creep.id] += creep.store.getUsedCapacity();
                }
                creep.transfer(container, RESOURCE_ENERGY);

            } else {

                if (!creep.memory.longDistanceMining.exitHome) {
                    //console.log('5');
                    let exitCode = creep.room.findExitTo(creep.memory.roomOrigin);
                    let exitPos = creep.pos.findClosestByPath(exitCode, { ignoreCreeps: true });
                    creep.memory.longDistanceMining.exitHome = { x: exitPos.x, y: exitPos.y };
                }
                pathfinding.modMoveTo(creep, new RoomPosition(creep.memory.longDistanceMining.exitHome.x, creep.memory.longDistanceMining.exitHome.y, creep.room.name), 0);

            }
        }


    }
    ,
    getMiningLocations: function (room) {
        const MiningLocations = [   { originRoom : 'E13N2', room: 'E13N3', maxMiners: 1 }];
        let locations = _.filter(MiningLocations, (l)=>l.originRoom === room.name);

        let assignedMiners = _.filter(Memory.creeps, (elem) => elem.longDistanceMining !== undefined && elem.role === 'longdistancehauler5');

        for (let l of locations) {

            let minersInLocation = _.filter(assignedMiners, (elem) => elem.longDistanceMining.room === l.room);
            l.maxMiners -= minersInLocation.length;

        }

        return locations;
    }
};


module.exports = roleLongDistanceHaulerLvl5;