let roleBuilder = require('role.builder');
let roleSimpleWorker = require('role.simpleWorker');
let roleBuilderLvl3 = require('role.builder.lvl3');
let roleCourierLvl3 = require('role.courier.lvl3');
let roleHarvesterLvl3 = require('role.harvester.lvl3');
let roleUpgraderLvl3 = require('role.upgrader.lvl3');
let roleLongDistanceMinerLvl3 = require('role.longdistanceminer.lvl3');
let InvasionControl = require('InvasionControl');
let roleClaimerLvl3 = require('role.claimer.lvl3');
let pathfinding = require('pathfinding');
let roleCourierLvl5 = require('role.courier.lvl5');
let roleBuilderLvl5 = require('role.builder.lvl5');
let roleReserverLvl5 = require('role.reserver.lvl5');
let roleLongDistanceMinerLvl5 = require('role.longdistanceminer.lvl5');
let roleLongDistanceHaulerLvl5 = require('role.longdistancehauler.lvl5');
let roleCourierLvl6 = require('role.courier.lvl6');
let roleOperatorLvl6 = require('role.operator.lvl6');
let roleHarvesterLvl6 = require('role.harvester.lvl6');
let roleMinerLvl6 = require('role.miner.lvl6');

let cpuLog = false;

module.exports.loop = function () {

    let currCpu = 0;
    if(Game.time % 5 === 0) {
        cpuLog = true;
        currCpu = Game.cpu.getUsed();
        if(!Memory.cpuUsage || Game.time % 500 === 0) {
            Memory.cpuUsage = {memoryRead : {v:0, n:0},
                pathingRecalculations : {v:0, n:0},
                rooms : {}};
        }
        Memory.cpuUsage.memoryRead = adjustAvgCpuUsage(Memory.cpuUsage.memoryRead, currCpu);
    }
    else {
        cpuLog = false;
    }

    if(Game.cpu.bucket >= 9980) {
        Game.cpu.generatePixel();
    }

    if(Game.time % pathfinding.cachePathClearInterval === 0) {
        for(let room in Game.rooms) {
            pathfinding.clearUnusedPaths(Game.rooms[room]);
        }
    }
    if(Game.time % pathfinding.matrixRecalculationInterval === 0) {
        for(let room in Game.rooms) {
            pathfinding.recalculateMatrixes(Game.rooms[room]);
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.pathingRecalculations = adjustAvgCpuUsage(Memory.cpuUsage.pathingRecalculations, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }
    // console.log('Memory upkeep: ' + Game.cpu.getUsed());
    let rooms = _.filter(Game.rooms, (room) => room.controller.my);
    for(let roomName in rooms) {
        let room = rooms[roomName]
        if(cpuLog) {
            if(!Memory.cpuUsage.rooms[room.name]) {
                Memory.cpuUsage.rooms[room.name] = {
                    total: {v:0, n:0},
                    init: {v:0, n:0},
                    tower : {v:0, n:0},
                    creepCount : {v:0, n:0},
                    spawning : {v:0, n:0}
                };
            }
            currCpu = Game.cpu.getUsed();
        }
        let roomLevel = GetRoomLevel(room);
        if(roomLevel === 1) {
            RunLevel1(room);
        }
        else if(roomLevel === 2) {
            RunLevel2(room);
        }
        else if(roomLevel === 3) {
            RunLevel3(room);
        }
        else if(roomLevel === 4) {
            RunLevel4(room);
        }
        else if(roomLevel === 5) {
            RunLevel5(room);
        }
        else {
            RunLatest(room);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].total = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].total, Game.cpu.getUsed() - currCpu);
            currCpu = Game.cpu.getUsed();
        }
    }


};

/**
 * @return {number}
 */
function GetRoomLevel(room) {
    if(room.memory.roomLevel && !(Game.time % 101 === 0)) {
        return room.memory.roomLevel;
    }

    // console.log('calc room level ' + room.name);
    let roomControllerLevel = room.controller.level;
    let storages = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_STORAGE});
    let containers = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_CONTAINER});
    let towers = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_TOWER});
    let links = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_LINK});
    let roomLevel = 1;
    if(roomControllerLevel >= 6 && room.energyCapacityAvailable >= 2300 && storages.length >= 1 && containers.length >= 4 && links.length >= 3) {
        roomLevel = 6;
    }
    else if(roomControllerLevel >= 5 && room.energyCapacityAvailable >= 1800 && storages.length >= 1 && containers.length >= 4) {
        roomLevel = 5;
    }
    else if(roomControllerLevel >= 4 && room.energyCapacityAvailable >= 1300 && storages.length >= 1 && containers.length >= 4) {
        roomLevel = 4;
    }
    else if(roomControllerLevel >= 3 && room.energyCapacityAvailable >= 800 && containers.length >= 3) {
        roomLevel = 3;
    }
    else if(roomControllerLevel >= 2 && room.energyCapacityAvailable >= 550) {
        roomLevel = 2;
    }
    else {
        roomLevel = 1;
    }
    room.memory.roomLevel = roomLevel;
    return roomLevel;
}

/** @param {Room} room */
function RunLevel1(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    // let sources = room.find(FIND_SOURCES);
    // for(let sourceName in sources) {
    //     Memory.structures['id'+sources[sourceName].id] = {creeps : 0};
    // }
    // for(let creepName in thisRoomCreeps) {
    //     // console.log(JSON.stringify(Memory.structures['id'+thisRoomCreeps[creepName].memory.sourceId]));
    //     if(thisRoomCreeps[creepName].memory.sourceId) {
    //         Memory.structures['id'+thisRoomCreeps[creepName].memory.sourceId].creeps++;
    //     }
    // }
    // console.log(JSON.stringify(Memory.structures['id5bbcadb09099fc012e637a41']));

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    let workers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'simpleWorker');
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');

    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }

    if(spawn) {
        //console.log('Workers: ' + workers.length)
        if(workers.length < 3) {
            //console.log("111");
            let newName = 'Worker' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { name : newName, roomOrigin : room.name, role: 'simpleWorker', harvesting: false, upgrading: false } });
        }
        else if (builders.length < 3) {
            let newName = 'Builder' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

        }
        if (spawn.spawning) {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                'oh no ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }


    for(let name in thisRoomCreeps) {
        let creep = thisRoomCreeps[name];
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        }
    }
}

/** @param {Room} room */
function RunLevel2(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    // let sourcesCreeps = {};
    // for(let name in thisRoomCreeps) {
    //     let creep = thisRoomCreeps[name];
    //     if (creep.memory.sourceId) {
    //         if (!sourcesCreeps['id'+creep.memory.sourceId]) {
    //             sourcesCreeps['id'+creep.memory.sourceId] = 0;
    //         }
    //         sourcesCreeps['id'+creep.memory.sourceId]++;
    //     }
    // }
    // for(let sourceId in sourcesCreeps) {
    //     Memory.structures[sourceId].creeps = sourcesCreeps[sourceId];
    // }

    let workers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'simpleWorker');
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');

    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }

    if(spawn) {
        //console.log('Workers: ' + workers.length)
        if(workers.length <= 3) {
            //console.log("111");
            let newName = 'Worker' + Game.time;
            spawn.spawnCreep([WORK, CARRY, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { name : newName, roomOrigin : room.name, role: 'simpleWorker', harvesting: false, upgrading: false } });
        }
        else if (builders.length <= 3) {
            let newName = 'Builder' + Game.time;
            spawn.spawnCreep([WORK, CARRY, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

        }
        if (spawn.spawning) {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                'oh no ' + spawningCreep.memory.role,
                spawn.pos.x + 1,
                spawn.pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }


    for(let name in thisRoomCreeps) {
        let creep = thisRoomCreeps[name];
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        }
    }
}

/** @param {Room} room */
function RunLevel3(room) {

    let currCpu = 0;
    if(cpuLog) {
        currCpu = Game.cpu.getUsed();
    }
    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10 === 0) {
        InitClearObjectsMemory();
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].init = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].init, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_TOWER
    });
    for(let tower in towers) {
        let closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            towers[tower].attack(closestHostile);
        }
        else {
            let ramparts = towers[tower].room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_RAMPART && structure.hits <= 300
            });
            if(ramparts && ramparts.length > 0) {
                towers[tower].repair(ramparts[0]);
            }
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].tower = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].tower, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let harvesters = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'claimer');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl3.getMiningLocations(room);
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].creepCount = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creepCount, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }
    let invasion = false;
    if(!Memory.invasionParameters) {
        Memory.invasionParameters = {gangNumerator : 0, gangs: [], invadeRoom : ''};
    }
    if(!Memory.invasionParameters.invasionDone) {
        if(Memory.invasionParameters.invadeRoom && (!Game.rooms[Memory.invasionParameters.invadeRoom] || (!Game.rooms[Memory.invasionParameters.invadeRoom].controller.my && !(Game.rooms[Memory.invasionParameters.invadeRoom].controller.owner === 'Aviack')))) {
            invasion = true;
            console.log('invading room ' + Memory.invasionParameters.invadeRoom);
        }
    }
    //console.log('Workers: ' + workers.length)
    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }

    if(spawn) {
        if(!invasion) {
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 4) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                // console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMiner' + Game.time;

                spawn.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistanceminer' } });
            }
            else if (builders.length < 3) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 3) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            // else if (claimers.length < 1) {
            //     let newName = 'Claimer' + Game.time;
            //     spawn.spawnCreep([CLAIM, MOVE], newName,
            //         { memory: { roomOrigin : room.name, role: 'claimer' } });
            //
            // }

            if (spawn.spawning) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    'oh no ' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    { align: 'left', opacity: 0.8 });
            }
        }
        else {
            console.log('INVASION MODE');
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { name : newName, roomOrigin : room.name, role: invader.role } });
                }

            }
            InvasionControl.run();
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].spawning = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].spawning, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }



    for(let name in thisRoomCreeps) {
        if(cpuLog) {
            currCpu = Game.cpu.getUsed();
            if(!Memory.cpuUsage.rooms[room.name].creeps) {
                Memory.cpuUsage.rooms[room.name].creeps = {
                    simpleWorker : {v:0, n:0},
                    builder : {v:0, n:0},
                    upgrader : {v:0, n:0},
                    courier : {v:0, n:0},
                    harvester : {v:0, n:0},
                    longdistanceminer : {v:0, n:0},
                    claimer : {v:0, n:0}
                }
            }
        }
        let creep = thisRoomCreeps[name];
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.simpleWorker = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.simpleWorker, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'builder') {
            roleBuilderLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.builder = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.builder, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgraderLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.upgrader = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.upgrader, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'courier') {
            roleCourierLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.courier = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.courier, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'harvester') {
            roleHarvesterLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.harvester = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.harvester, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistanceminer') {
            roleLongDistanceMinerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'claimer') {
            roleClaimerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.claimer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.claimer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
    }

}

/** @param {Room} room */
function RunLevel4(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10 === 0) {
        InitClearObjectsMemory();
    }

    let towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_TOWER
    });
    for(let tower in towers) {
        let closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            towers[tower].attack(closestHostile);
        }
        else {
            let ramparts = towers[tower].room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_RAMPART && structure.hits <= 300
            });
            if(ramparts && ramparts.length > 0) {
                towers[tower].repair(ramparts[0]);
            }
            else {
                let damagedCreeps = towers[tower].room.find(FIND_MY_CREEPS, {
                    filter : (creep) => creep.hits < creep.hitsMax
                });
                if(damagedCreeps && damagedCreeps.length > 0) {
                    towers[tower].heal(damagedCreeps[0]);
                }
            }
        }
    }

    let harvesters = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'claimer');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl3.getMiningLocations(room);
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    let invasion = false;
    if(!Memory.invasionParameters) {
        Memory.invasionParameters = {gangNumerator : 0, gangs: [], invadeRoom : ''};
    }
    if(!Memory.invasionParameters.invasionDone) {
        if(Memory.invasionParameters.invadeRoom && (!Game.rooms[Memory.invasionParameters.invadeRoom] || (!Game.rooms[Memory.invasionParameters.invadeRoom].controller.my && !(Game.rooms[Memory.invasionParameters.invadeRoom].controller.owner === 'Aviack')))) {
            invasion = true;
            console.log('invading room ' + Memory.invasionParameters.invadeRoom);
        }
    }
    //console.log('Workers: ' + workers.length)
    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }

    if(spawn) {
        if(!invasion) {
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 3) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMiner' + Game.time;

                spawn.spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistanceminer', timeBorn : Game.time } });
            }
            else if (builders.length < 3) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 3) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (claimers.length < 1 && room.memory.claiming && room.memory.claiming.claimRoom) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'claimer' } });

            }

            if (spawn.spawning) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    'oh no ' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    { align: 'left', opacity: 0.8 });
            }
        }
        else {
            console.log('INVASION MODE');
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { name : newName, roomOrigin : room.name, role: invader.role } });
                }

            }
            InvasionControl.run();
        }
    }



    for(let name in thisRoomCreeps) {
        let creep = thisRoomCreeps[name];
        if(!Game.getObjectById(creep.id)) {
            continue;
        }
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilderLvl3.run(creep);
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgraderLvl3.run(creep);
        }
        if (creep.memory.role === 'courier') {
            roleCourierLvl3.run(creep);
        }
        if (creep.memory.role === 'harvester') {
            roleHarvesterLvl3.run(creep);
        }
        if (creep.memory.role === 'longdistanceminer') {
            roleLongDistanceMinerLvl3.run(creep);
        }
        if (creep.memory.role === 'claimer') {
            roleClaimerLvl3.run(creep);
        }
    }
}

/** @param {Room} room */
function RunLevel5(room) {

    let currCpu = 0;
    if(cpuLog) {
        currCpu = Game.cpu.getUsed();
    }

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Memory.creeps[name].onDeathEffect && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10 === 0) {
        InitClearObjectsMemory();
    }

    if(Game.time % 11 === 0) {
        ProcessCreepsOnDeathEffects();
    }

    //while it's all shit with requests
    if(Game.time % 6 === 0) {
        let couriersRequestedTotal = 0;
        for(let creepName in Memory.creeps) {
            if(Memory.creeps[creepName].role === 'courier') {
                couriersRequestedTotal += Memory.creeps[creepName].requested;
            }
        }
        if(couriersRequestedTotal === 0) {
            for(let structureId in Memory.structures) {
                if(Memory.structures[structureId].requested) {
                    Memory.structures[structureId].requested = 0;
                }
            }
        }
    }

    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].init = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].init, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_TOWER
    });
    for(let tower in towers) {
        let closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            towers[tower].attack(closestHostile);
        }
        else {
            let ramparts = towers[tower].room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_RAMPART && structure.hits <= 300
            });
            if(ramparts && ramparts.length > 0) {
                towers[tower].repair(ramparts[0]);
            }
            else {
                let damagedCreeps = towers[tower].room.find(FIND_MY_CREEPS, {
                    filter : (creep) => creep.hits < creep.hitsMax
                });
                //console.log('en ' + JSON.stringify(tower.store));
                if(damagedCreeps && damagedCreeps.length > 0) {
                    towers[tower].heal(damagedCreeps[0]);
                }
                else if(towers[tower].energy > 500) {
                    // console.log('tower repair');
                    let damagedStructures = towers[tower].room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType !== STRUCTURE_RAMPART
                            && structure.structureType !== STRUCTURE_WALL
                            && (structure.hits / structure.hitsMax) < 0.9
                    });
                    let otherTowers = towers[tower].room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType === STRUCTURE_TOWER && structure.id !== tower.id
                    });
                    // console.log('structures to rep ' + damagedStructures.length);
                    // console.log('other towers ' + otherTowers.length);
                    let repaired = [];
                    for(let currStructureId in damagedStructures) {
                        let currStructure = damagedStructures[currStructureId];
                        if(repaired.includes(currStructure.id)) {
                            continue;
                        }
                        if(currStructure.pos.getRangeTo(towers[tower].pos) <= 5) {
                            // console.log('111 repair');
                            towers[tower].repair(currStructure);
                            repaired.push(currStructure.id);
                        }
                        else {
                            let inRangeOfOtherTower = false;
                            for(let otherTowerId in otherTowers) {
                                let otherTower = otherTowers[otherTowerId];
                                if(otherTower.pos.getRangeTo(currStructure.pos) <= 5) {
                                    inRangeOfOtherTower = true;
                                    break;
                                }
                            }
                            // console.log('r333');
                            if(!inRangeOfOtherTower) {
                                // console.log('222 repair');
                                towers[tower].repair(currStructure);
                                repaired.push(currStructure.id);
                            }
                        }
                    }
                }
            }
        }
    }

    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].tower = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].tower, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let harvesters = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'harvester' && (!creep.memory.ticksBeforeWork || creep.ticksToLive >= creep.memory.ticksBeforeWork));
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'claimer');
    let reservers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'reserver');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl5.getMiningLocations(room);
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    if(longDistanceMinersRequired > 0) {
        longDistanceMinersRequired -= roleLongDistanceMinerLvl5.countUnassignedMiners(room);
    }
    let longDistanceHaulingLocations = roleLongDistanceHaulerLvl5.getMiningLocations(room);
    let longDistanceHaulersRequired = 0;
    for (let i of longDistanceHaulingLocations) {
        longDistanceHaulersRequired += i.maxMiners;
    }
    if(longDistanceHaulersRequired > 0) {
        longDistanceHaulersRequired -= roleLongDistanceHaulerLvl5.countUnassignedHaulers(room);
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].creepCount = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creepCount, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }
    let invasion = false;
    if(!Memory.invasionParameters) {
        Memory.invasionParameters = {gangNumerator : 0, gangs: [], invadeRoom : ''};
    }
    if(!Memory.invasionParameters.invasionDone) {
        if(Memory.invasionParameters.invadeRoom && (!Game.rooms[Memory.invasionParameters.invadeRoom] || (!Game.rooms[Memory.invasionParameters.invadeRoom].controller.my && !(Game.rooms[Memory.invasionParameters.invadeRoom].controller.owner === 'Aviack')))) {
            invasion = true;
            console.log('invading room ' + Memory.invasionParameters.invadeRoom);
        }
    }
    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }
    //console.log('Workers: ' + workers.length)
    if(spawn) {
        if(!invasion) {
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time} });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 3) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMinerMk5' + Game.time;

                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistanceminer5', timeBorn : Game.time } });
            }
            else if (longDistanceHaulersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceHaulerMk5' + Game.time;

                spawn.spawnCreep([CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistancehauler5' } });
            }
            else if (builders.length < 2) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 2) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (claimers.length < 1 && room.memory.claiming && room.memory.claiming.claimRoom && (!Game.rooms[room.memory.claiming.claimRoom] || !Game.rooms[room.memory.claiming.claimRoom].controller.my)) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'claimer' } });

            }
            else if (reservers.length < 1 &&  room.memory.reserving && room.memory.reserving.reserveRoom && (!Game.rooms[room.memory.reserving.reserveRoom] || !Game.rooms[room.memory.reserving.reserveRoom].controller.my)) {
                let newName = 'Reserver' + Game.time;
                let body = [];
                if(!Game.rooms[room.memory.reserving.reserveRoom] || !Game.rooms[room.memory.reserving.reserveRoom].controller.reservation || Game.rooms[room.memory.reserving.reserveRoom].controller.reservation.ticksToEnd < 1000) {
                    body = [CLAIM, CLAIM, MOVE, MOVE];
                }
                else {
                    body = [CLAIM, MOVE];
                }
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'reserver' } });

            }

            if (spawn.spawning) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    'oh no ' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    { align: 'left', opacity: 0.8 });
            }
        }
        else {
            console.log('INVASION MODE');
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { name : newName, roomOrigin : room.name, role: invader.role } });
                }

            }
            InvasionControl.run();
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].spawning = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].spawning, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    for(let name in thisRoomCreeps) {
        if(cpuLog) {
            currCpu = Game.cpu.getUsed();
            if(!Memory.cpuUsage.rooms[room.name].creeps) {
                Memory.cpuUsage.rooms[room.name].creeps = {
                    simpleWorker : {v:0, n:0},
                    builder : {v:0, n:0},
                    upgrader : {v:0, n:0},
                    courier : {v:0, n:0},
                    harvester : {v:0, n:0},
                    longdistanceminer : {v:0, n:0},
                    longdistanceminer5 : {v:0, n:0},
                    longdistancehauler5 : {v:0, n:0},
                    claimer : {v:0, n:0},
                    reserver : {v:0, n:0}
                }
            }
        }
        let creep = thisRoomCreeps[name];
        if(!Game.getObjectById(creep.id)) {
            continue;
        }
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.simpleWorker = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.simpleWorker, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'builder') {
            roleBuilderLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.builder = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.builder, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgraderLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.upgrader = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.upgrader, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'harvester') {
            roleHarvesterLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.harvester = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.harvester, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistanceminer') {
            roleLongDistanceMinerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistanceminer5') {
            roleLongDistanceMinerLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer5 = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer5, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistancehauler5') {
            roleLongDistanceHaulerLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistancehauler5 = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistancehauler5, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'claimer') {
            roleClaimerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.claimer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.claimer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'reserver') {
            roleReserverLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.reserver = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.reserver, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'courier') {
            roleCourierLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.courier = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.courier, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
    }
}

/** @param {Room} room */
function RunLatest(room) {

    let currCpu = 0;
    if(cpuLog) {
        currCpu = Game.cpu.getUsed();
    }

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250 === 0) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Memory.creeps[name].onDeathEffect && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10 === 0) {
        InitClearObjectsMemory();
    }

    if(Game.time % 11 === 0) {
        ProcessCreepsOnDeathEffects();
    }

    //while it's all shit with requests
    if(Game.time % 6 === 0) {
        let couriersRequestedTotal = 0;
        for(let creepName in Memory.creeps) {
            if(Memory.creeps[creepName].role === 'courier') {
                couriersRequestedTotal += Memory.creeps[creepName].requested;
            }
        }
        if(couriersRequestedTotal === 0) {
            for(let structureId in Memory.structures) {
                if(Memory.structures[structureId].requested) {
                    Memory.structures[structureId].requested = 0;
                }
            }
        }
    }

    if(Game.time % 10 === 0) {
        let links = room.find(FIND_STRUCTURES, {
            filter : (structure) => structure.structureType === STRUCTURE_LINK
        });

        for(let linkIndex in links) {
            if(!Memory.structures['id'+links[linkIndex].id]) {
                Memory.structures['id'+links[linkIndex].id] = {};
            }
        }
    }

    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].init = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].init, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let towers = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_TOWER
    });
    for(let tower in towers) {
        let closestHostile = towers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            towers[tower].attack(closestHostile);
        }
        else {
            let ramparts = towers[tower].room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_RAMPART && structure.hits <= 300
            });
            if(ramparts && ramparts.length > 0) {
                towers[tower].repair(ramparts[0]);
            }
            else {
                let damagedCreeps = towers[tower].room.find(FIND_MY_CREEPS, {
                    filter : (creep) => creep.hits < creep.hitsMax
                });
                //console.log('en ' + JSON.stringify(tower.store));
                if(damagedCreeps && damagedCreeps.length > 0) {
                    towers[tower].heal(damagedCreeps[0]);
                }
                else if(towers[tower].energy > 500) {
                    // console.log('tower repair');
                    let damagedStructures = towers[tower].room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType !== STRUCTURE_RAMPART
                                            && structure.structureType !== STRUCTURE_WALL
                                            && (structure.hits / structure.hitsMax) < 0.9
                    });
                    let otherTowers = towers[tower].room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType === STRUCTURE_TOWER && structure.id !== tower.id
                    });
                    // console.log('structures to rep ' + damagedStructures.length);
                    // console.log('other towers ' + otherTowers.length);
                    let repaired = [];
                    for(let currStructureId in damagedStructures) {
                        let currStructure = damagedStructures[currStructureId];
                        if(repaired.includes(currStructure.id)) {
                            continue;
                        }
                        if(currStructure.pos.getRangeTo(towers[tower].pos) <= 5) {
                            // console.log('111 repair');
                            towers[tower].repair(currStructure);
                            repaired.push(currStructure.id);
                        }
                        else {
                            let inRangeOfOtherTower = false;
                            for(let otherTowerId in otherTowers) {
                                let otherTower = otherTowers[otherTowerId];
                                if(otherTower.pos.getRangeTo(currStructure.pos) <= 5) {
                                    inRangeOfOtherTower = true;
                                    break;
                                }
                            }
                            // console.log('r333');
                            if(!inRangeOfOtherTower) {
                                // console.log('222 repair');
                                towers[tower].repair(currStructure);
                                repaired.push(currStructure.id);
                            }
                        }
                    }
                }
            }
        }
    }

    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].tower = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].tower, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let harvesters = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'harvester' && (!creep.memory.ticksBeforeWork || creep.ticksToLive >= creep.memory.ticksBeforeWork));
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'courier');
    let operators = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'operator');
    let claimers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'claimer');
    let reservers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'reserver');
    let miners = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'miner' && (!creep.memory.ticksBeforeWork || creep.ticksToLive >= creep.memory.ticksBeforeWork));;
    let mineral = undefined;
    if(!room.memory.mineralId) {
        let minerals = room.find(FIND_MINERALS);
        mineral = minerals[0];
        room.memory.mineralId = mineral.id;
    }
    else {
        mineral = Game.getObjectById(room.memory.mineralId);
    }
    let minersRequers = (mineral.mineralAmount > 0);

    let longDistanceMiningLocations = roleLongDistanceMinerLvl5.getMiningLocations(room);
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    if(longDistanceMinersRequired > 0) {
        longDistanceMinersRequired -= roleLongDistanceMinerLvl5.countUnassignedMiners(room);
    }
    let longDistanceHaulingLocations = roleLongDistanceHaulerLvl5.getMiningLocations(room);
    let longDistanceHaulersRequired = 0;
    for (let i of longDistanceHaulingLocations) {
        longDistanceHaulersRequired += i.maxMiners;
    }
    if(longDistanceHaulersRequired > 0) {
        longDistanceHaulersRequired -= roleLongDistanceHaulerLvl5.countUnassignedHaulers(room);
    }
    let maxCostCourierExists;
    for(let creepName in couriers) {
        let creep = couriers[creepName];
        if(creep.memory.maxCost === undefined) {
            let cost = 0;
            for(let bodyPartIndex in creep.body) {
                if(creep.body[bodyPartIndex] === WORK) {
                    cost+=100;
                }
                else {
                    cost+=50;
                }
            }
            creep.memory.maxCost = (cost >= roleCourierLvl6.maxCost);
        }
        maxCostCourierExists = creep.memory.maxCost;
        if(maxCostCourierExists) {
            break;
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].creepCount = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creepCount, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }
    let invasion = false;
    if(!Memory.invasionParameters) {
        Memory.invasionParameters = {gangNumerator : 0, gangs: [], invadeRoom : ''};
    }
    if(!Memory.invasionParameters.invasionDone) {
        if(Memory.invasionParameters.invadeRoom && (!Game.rooms[Memory.invasionParameters.invadeRoom] || (!Game.rooms[Memory.invasionParameters.invadeRoom].controller.my && !(Game.rooms[Memory.invasionParameters.invadeRoom].controller.owner === 'Aviack')))) {
            invasion = true;
            console.log('invading room ' + Memory.invasionParameters.invadeRoom);
        }
    }
    let spawn = undefined;
    if(room.memory.spawnName) {
        spawn = Game.spawns[room.memory.spawnName];
        if(spawn.room.name !== room.name) {
            spawn = undefined;
        }
    }
    if(!spawn) {
        for(let spawnName in Game.spawns) {
            if(Game.spawns[spawnName].room.name === room.name) {
                spawn = Game.spawns[spawnName];
                break;
            }
        }
        if(spawn) {
            room.memory.spawnName = spawn.name;
        }
    }
    //console.log('Workers: ' + workers.length)
    if(spawn) {
        if(!invasion) {
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time} });
            }
            else if (operators.length < 1) {
                let newName = 'Operator' + Game.time;
                let body = roleOperatorLvl6.getBody(room.energyAvailable);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'operator' } });

            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                let body = roleCourierLvl6.getBody(room.energyAvailable);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier' } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                let body = roleUpgraderLvl3.getBody(room.energyAvailable);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if(!maxCostCourierExists) {
                let newName = 'Courier' + Game.time;
                let body = roleCourierLvl6.getBody(room.energyAvailable, true);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier' } });
            }
            else if (longDistanceMinersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMinerMk5' + Game.time;

                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistanceminer5', timeBorn : Game.time } });
            }
            else if (longDistanceHaulersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceHaulerMk5' + Game.time;

                spawn.spawnCreep([CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'longdistancehauler5' } });
            }
            else if (builders.length < 2) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (claimers.length < 1 && room.memory.claiming && room.memory.claiming.claimRoom && (!Game.rooms[room.memory.claiming.claimRoom] || !Game.rooms[room.memory.claiming.claimRoom].controller.my)) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'claimer' } });

            }
            else if (reservers.length < 1 &&  room.memory.reserving && room.memory.reserving.reserveRoom && (!Game.rooms[room.memory.reserving.reserveRoom] || !Game.rooms[room.memory.reserving.reserveRoom].controller.my)) {
                let newName = 'Reserver' + Game.time;
                let body = [];
                if(!Game.rooms[room.memory.reserving.reserveRoom] || !Game.rooms[room.memory.reserving.reserveRoom].controller.reservation || Game.rooms[room.memory.reserving.reserveRoom].controller.reservation.ticksToEnd < 1000) {
                    body = [CLAIM, CLAIM, MOVE, MOVE];
                }
                else {
                    body = [CLAIM, MOVE];
                }
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'reserver' } });

            }
            else if(minersRequers && miners.length < 1) {
                //console.log("111");
                let newName = 'Miner' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'miner', timeBorn : Game.time } });
            }

            if (spawn.spawning) {
                let spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    'oh no ' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    { align: 'left', opacity: 0.8 });
            }
        }
        else {
            console.log('INVASION MODE');
            if(harvesters.length < 1) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (operators.length < 1) {
                let newName = 'Operator' + Game.time;
                let body = roleOperatorLvl6.getBody(room.energyAvailable);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'operator' } });

            }
            else if (couriers.length < 1) {
                let body = roleCourierLvl6.getBody(room.energyAvailable);
                spawn.spawnCreep(body, newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'courier' } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'harvester', timeBorn : Game.time } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, CARRY, MOVE, MOVE], newName,
                    { memory: { name : newName, roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { name : newName, roomOrigin : room.name, role: invader.role } });
                }

            }
            InvasionControl.run();
        }
    }
    if(cpuLog) {
        Memory.cpuUsage.rooms[room.name].spawning = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].spawning, Game.cpu.getUsed()-currCpu);
        currCpu = Game.cpu.getUsed();
    }

    let harvestLinks = room.find(FIND_STRUCTURES, {
        filter : (structure) => structure.structureType === STRUCTURE_LINK
                            && Memory.structures['id'+structure.id]
                            && Memory.structures['id'+structure.id].linkType === 'Harvest'
    });
    let requestLink = room.find(FIND_STRUCTURES, {
        filter : (structure) => structure.structureType === STRUCTURE_LINK
            && Memory.structures['id'+structure.id]
            && Memory.structures['id'+structure.id].linkType === 'Request'
    });
    if(requestLink && requestLink.length > 0) {
        requestLink = requestLink[0];
    }
    let requestLinkFreeCapacity = requestLink.store.getFreeCapacity(RESOURCE_ENERGY);
    for(let linkIndex in harvestLinks) {
        if(requestLinkFreeCapacity === 0) {
            break;
        }
        let harvestLink = harvestLinks[linkIndex];
        let harvestLinkEnergy = harvestLink.store.getUsedCapacity(RESOURCE_ENERGY);
        let harvestLinkCapacity = harvestLink.store.getCapacity(RESOURCE_ENERGY);

        if(harvestLink.cooldown === 0 && (requestLinkFreeCapacity) >= 100 && ((harvestLinkEnergy >= requestLinkFreeCapacity) || (harvestLinkEnergy === harvestLinkCapacity))) {
            harvestLink.transferEnergy(requestLink);
            break;
        }
    }

    for(let name in thisRoomCreeps) {
        if(cpuLog) {
            currCpu = Game.cpu.getUsed();
            if(!Memory.cpuUsage.rooms[room.name].creeps) {
                Memory.cpuUsage.rooms[room.name].creeps = {
                    simpleWorker : {v:0, n:0},
                    builder : {v:0, n:0},
                    upgrader : {v:0, n:0},
                    courier : {v:0, n:0},
                    harvester : {v:0, n:0},
                    longdistanceminer : {v:0, n:0},
                    longdistanceminer5 : {v:0, n:0},
                    longdistancehauler5 : {v:0, n:0},
                    claimer : {v:0, n:0},
                    operator : {v:0, n:0},
                    miner : {v:0, n:0},
                    reserver : {v:0, n:0}
                }
            }
        }
        let creep = thisRoomCreeps[name];
        if(!Game.getObjectById(creep.id)) {
            continue;
        }
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.simpleWorker = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.simpleWorker, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'builder') {
            roleBuilderLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.builder = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.builder, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgraderLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.upgrader = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.upgrader, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'harvester') {
            roleHarvesterLvl6.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.harvester = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.harvester, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistanceminer') {
            roleLongDistanceMinerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistanceminer5') {
            roleLongDistanceMinerLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer5 = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistanceminer5, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'longdistancehauler5') {
            roleLongDistanceHaulerLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.longdistancehauler5 = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.longdistancehauler5, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'claimer') {
            roleClaimerLvl3.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.claimer = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.claimer, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'reserver') {
            roleReserverLvl5.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.reserver = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.reserver, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
        if (creep.memory.role === 'operator') {
            roleOperatorLvl6.run(creep);
        }
        if (creep.memory.role === 'courier') {
            roleCourierLvl6.run(creep);
        }
        if (creep.memory.role === 'miner') {
            roleMinerLvl6.run(creep);
        }
        if(cpuLog) {
            Memory.cpuUsage.rooms[room.name].creeps.courier = adjustAvgCpuUsage(Memory.cpuUsage.rooms[room.name].creeps.courier, Game.cpu.getUsed()-currCpu);
            currCpu = Game.cpu.getUsed();
        }
    }
}

function InitClearObjectsMemory() {
    if(Memory.structures === undefined) {
        Memory.structures = {};
    }
    for(let structureId in Memory.structures) {
        let cleanId = structureId.slice(2);
        if(!Game.getObjectById(cleanId)) {
            delete Memory.structures[structureId];
        }
    }
    for(let MemoryObj in Memory) {
        if(MemoryObj.includes('LongDistanceMiner')) {
            delete Memory[MemoryObj];
        }
        if(MemoryObj.includes('onDeath') && (Game.time - Memory[MemoryObj] > 1000)) {
            delete Memory[MemoryObj];
        }
    }

    for(let roomMemory in Memory.rooms) {
        for(let path in Memory.rooms[roomMemory].cachePath) {
            if(Memory.rooms[roomMemory].cachePath[path] == null) {
                Memory.rooms[roomMemory].cachePath.splice(path, 1);
            }
        }
    }

    //init containers

    for(let room in Game.rooms) {
        let containers = Game.rooms[room].find(FIND_STRUCTURES, {
            filter : (structure) => structure.structureType === STRUCTURE_CONTAINER
        });
        // console.log('0123')
        // console.log(JSON.stringify(containers));
        // console.log(room);
        // console.log(Game.rooms[room]);
        for(let cont in containers) {
            let containerMemoryIndex = 'id'+containers[cont].id;
            if(Memory.structures[containerMemoryIndex] === undefined) {
                Memory.structures[containerMemoryIndex] = {containerType: ''};
            }
            else {
                if(Memory.structures[containerMemoryIndex].harvester && !Game.getObjectById(Memory.structures[containerMemoryIndex].harvester)) {
                    Memory.structures[containerMemoryIndex].harvester = undefined;
                }
            }
        }
        if(Game.rooms[room].storage && !Memory.structures['id'+Game.rooms[room].storage.id]) {
            Memory.structures['id'+Game.rooms[room].storage.id] = {};
        }
    }
}

function ProcessCreepsOnDeathEffects() {
    for(let creepName in Memory.creeps) {
        if(Memory.creeps[creepName].onDeathEffect === true && !Game.creeps[creepName]) {
            if (Memory.creeps[creepName].role === 'courier') {
                let roomName = Memory.creeps[creepName].roomOrigin;
                let roomLevel = Memory.rooms[roomName].roomLevel;
                if(roomLevel <= 4) {
                    roleCourierLvl3.processOnDeathEffect(creepName);
                }
                else if(roomLevel <= 5) {
                    roleCourierLvl5.processOnDeathEffect(creepName);
                }
                else {
                    roleCourierLvl6.processOnDeathEffect(creepName);
                }
                delete Memory.creeps[creepName];
            }
            else if (Memory.creeps[creepName].role === 'simpleWorker') {
                roleSimpleWorker.processOnDeathEffect(creepName);
                delete Memory.creeps[creepName];
            }
            else if (Memory.creeps[creepName].role === 'builder') {
                let roomName = Memory.creeps[creepName].roomOrigin;
                let roomLevel = Memory.rooms[roomName].roomLevel;
                if(roomLevel <= 2) {
                    roleBuilder.processOnDeathEffect(creepName);
                }
                else if(roomLevel <= 4) {
                    roleBuilderLvl3.processOnDeathEffect(creepName);
                }
                else {
                    roleBuilderLvl5.processOnDeathEffect(creepName);
                }
                delete Memory.creeps[creepName];
            }
            else if (Memory.creeps[creepName].role === 'operator') {
                roleOperatorLvl6.processOnDeathEffect(creepName);
                delete Memory.creeps[creepName];
            }
        }

    }
}

function adjustAvgCpuUsage(currAvgObj, cpuUsage) {
    if(currAvgObj.n<0) {
        currAvgObj = {v:0, n:0};
    }
    if(cpuUsage < 0) {
        return currAvgObj;
    }
    return {v: (currAvgObj.n*currAvgObj.v+cpuUsage)/(currAvgObj.n+1), n: currAvgObj.n+1};
}
