var pathfinding = require('Pathfinding');

var roleLongDistanceMinerLvl3 = {

    /** @param {Creep} creep **/
    run: function (creep) {
        //creep.moveTo(Game.flags.IdleFlag);
        //return;
        //initialize memory
        //creep.memory.longDistanceMining = undefined;
        //console.log('' + creep + ' ' + creep.memory.longDistanceMining);

        if (!creep.memory.longDistanceMining) {
            console.log('INIT MINER');
            creep.memory.longDistanceMining = {};
            let miningLocations = _.filter(this.getMiningLocations(), (elem) => elem.maxMiners > 0);
            //console.log('miningLocations=' + miningLocations);

            if (miningLocations.length > 0) {
                let location = _.first(miningLocations);
                creep.memory.longDistanceMining.room = location.room;
                creep.memory.longDistanceMining.x = location.x;
                creep.memory.longDistanceMining.y = location.y;

                if (creep.room.name !== location.room) {
                    let exitCode = creep.room.findExitTo(location.room);
                    let exitPos = creep.pos.findClosestByPath(exitCode, {ignoreCreeps: true});
                    //console.log('INIT MINER');
                    if (!exitPos) {
                        //wait a turn
                        //console.log('WAIT A TURN');
                        creep.memory.longDistanceMining = undefined;
                        return;
                    }
                    creep.memory.longDistanceMining.exitToMining = { x: exitPos.x, y: exitPos.y};
                }
            } else {
                creep.moveTo(Game.flags.idleFlag)
            }
        }
        if (!creep.memory.mining) {
            creep.memory.mining = true;
        }
        //console.log('' + (creep.memory.mining == true && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity));
        if (creep.memory.mining === true && creep.store.getUsedCapacity() === creep.store.getCapacity()) {
            creep.memory.mining = false;
        }
        //console.log(creep.memory.mining);
        if (creep.memory.mining === false && creep.store.getUsedCapacity()  === 0) {
            creep.memory.mining = true;
        }
        //console.log(creep.memory.mining);

        if (creep.memory.mining === true) {
            //console.log('2' + creep.memory.mining);
            if (creep.room.name === creep.memory.longDistanceMining.room && creep.pos.getRangeTo(creep.memory.longDistanceMining.x, creep.memory.longDistanceMining.y) <= 1) {
                if (creep.memory.longDistanceMining.sourceId === undefined) {
                    creep.memory.longDistanceMining.sourceId = creep.pos.findClosestByRange(FIND_SOURCES).id;
                }
                let source = Game.getObjectById(creep.memory.longDistanceMining.sourceId);
                creep.harvest(source);
            } else if (creep.room.name !== creep.memory.longDistanceMining.room) {
                let exitToMining = new RoomPosition(creep.memory.longDistanceMining.exitToMining.x, creep.memory.longDistanceMining.exitToMining.y, creep.room.name);

                //check exit to mining for being the closest
                if(creep.memory.longDistanceMining.containerLocation
                        && !creep.memory.longDistanceMining.exitCheckDone
                        && creep.pos.isEqualTo(new RoomPosition(creep.memory.longDistanceMining.containerLocation.x, creep.memory.longDistanceMining.containerLocation.y, creep.room.name))
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

                creep.moveTo(exitToMining);
            } else {
                creep.moveTo(new RoomPosition(creep.memory.longDistanceMining.x, creep.memory.longDistanceMining.y, creep.memory.longDistanceMining.room));
            }
        } else {
            //console.log('1' + creep.memory.mining);
            if (creep.room.name === 'E13N2') {
                //console.log('3');
                if (!creep.memory.longDistanceMining.containerLocation) {
                    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+s.id]
                            && Memory.structures['id'+s.id].containerType === 'Provider'
                    });

                    creep.memory.longDistanceMining.containerLocation = { x: container.pos.x, y: container.pos.y, room: container.room.name };
                    creep.memory.longDistanceMining.containerId = container.id;
                }

                let containerPostion = new RoomPosition(creep.memory.longDistanceMining.containerLocation.x, creep.memory.longDistanceMining.containerLocation.y, creep.room.name);
                if (creep.pos.isEqualTo(containerPostion)) {
                    // if(!Memory['LongDistanceMiner'+creep.id]) {
                    //     Memory['LongDistanceMiner'+creep.id] = 0;
                    // }
                    // Memory['LongDistanceMiner'+creep.id] += creep.store.getUsedCapacity();
                    creep.drop(RESOURCE_ENERGY);
                } else {
                    creep.moveTo(containerPostion);
                }

            } else {
                //console.log('4');
                if (!creep.memory.longDistanceMining.exitHome) {
                    //console.log('5');
                    let exitCode = creep.room.findExitTo('E13N2');
                    let exitPos = creep.pos.findClosestByPath(exitCode, { ignoreCreeps: true });
                    creep.memory.longDistanceMining.exitHome = { x: exitPos.x, y: exitPos.y };
                }
                //console.log('6');
                creep.moveTo(new RoomPosition(creep.memory.longDistanceMining.exitHome.x, creep.memory.longDistanceMining.exitHome.y, creep.room.name));

            }

        }


    }
    ,
    getMiningLocations: function () {
        let locations = [{ room: 'E13N3', x: 42, y: 34, maxMiners: 2 }, { room: 'E13N1', x: 19, y: 33, maxMiners: 3 }, { room: 'E13N1', x: 37, y: 39, maxMiners: 3 }];

        let assignedMiners = _.filter(Memory.creeps, (elem) => elem.longDistanceMining != undefined);

        for (let l of locations) {

            let minersInLocation = _.filter(assignedMiners, (elem) => elem.longDistanceMining.x === l.x && elem.longDistanceMining.y === l.y && elem.longDistanceMining.room === l.room);
            l.maxMiners -= minersInLocation.length;

        }

        return locations;
    }
};


module.exports = roleLongDistanceMinerLvl3;