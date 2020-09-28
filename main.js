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

module.exports.loop = function () {

    if(Game.time % pathfinding.cachePathClearInterval) {
        for(let room in Game.rooms) {
            pathfinding.clearUnusedPaths(Game.rooms[room]);
        }
    }
    // console.log('Memory upkeep: ' + Game.cpu.getUsed());
    let rooms = _.filter(Game.rooms, (room) => room.controller.my);
    for(let roomName in rooms) {
        let room = rooms[roomName];
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
        else {
            RunLatest(room);
        }
    }


};

/**
 * @return {number}
 */
function GetRoomLevel(room) {
    if(room.memory.roomLevel && !(Game.time % 101)) {
        return room.memory.roomLevel;
    }

    let roomControllerLevel = room.controller.level;
    let storages = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_STORAGE});
    let containers = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_CONTAINER});
    let towers = room.find(FIND_STRUCTURES, {filter : (s) => s.structureType === STRUCTURE_TOWER});
    let roomLevel = 1;
    if(roomControllerLevel >= 5 && room.energyCapacityAvailable >= 1800 && storages.length >= 1 && containers.length >= 5) {
        roomLevel = 5;
    }
    else if(roomControllerLevel >= 4 && room.energyCapacityAvailable >= 1300 && storages.length >= 1 && containers.length >= 5) {
        roomLevel = 4;
    }
    else if(roomControllerLevel >= 3 && room.energyCapacityAvailable >= 800 && containers.length >= 5) {
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

    if (Game.time % 250) {
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
        if(workers.length <= 5) {
            //console.log("111");
            let newName = 'Worker' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { roomOrigin : room.name, role: 'simpleWorker', harvesting: false, upgrading: false } });
        }
        else if (builders.length <= 3) {
            let newName = 'Builder' + Game.time;
            spawn.spawnCreep([WORK, CARRY, MOVE], newName,
                { memory: { roomOrigin : room.name, role: 'builder', building: false } });

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
    RunLevel1(room);
}

/** @param {Room} room */
function RunLevel3(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
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
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 4) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                // console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMiner' + Game.time;

                spawn.spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'longdistanceminer' } });
            }
            else if (builders.length < 4) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 4) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (claimers.length < 1) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'claimer' } });

            }

            if (Gspawn.spawning) {
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
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { roomOrigin : room.name, role: invader.role } });
                }

            }
            InvasionControl.run();
        }
    }



    for(let name in thisRoomCreeps) {
        let creep = thisRoomCreeps[name];
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
function RunLevel4(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
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
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 4) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMiner' + Game.time;

                spawn.spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'longdistanceminer' } });
            }
            else if (builders.length < 4) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 4) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (claimers.length < 1 && Memory.claiming && Memory.claiming.claimRoom) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'claimer' } });

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
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { roomOrigin : room.name, role: invader.role } });
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
function RunLatest(room) {

    let thisRoomCreeps = _.filter(Game.creeps, (creep) => creep.memory.roomOrigin === room.name);

    if (Game.time % 250) {
        for (let name in Memory.creeps) {
            if (Memory.creeps[name].roomOrigin === room.name && !Memory.creeps[name].onDeathEffect && !Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
        InitClearObjectsMemory();
    }

    if(Game.time % 11) {
        ProcessCreepsOnDeathEffects();
    }

    // //while it's all shit with requests
    // if(Game.time % 6) {
    //     let couriersRequestedTotal = 0;
    //     for(let creepName in Memory.creeps) {
    //         if(Memory.creeps[creepName].role === 'courier') {
    //             couriersRequestedTotal += Memory.creeps[creepName].requested;
    //         }
    //     }
    //     if(couriersRequestedTotal === 0) {
    //         for(let structureId in Memory.structures) {
    //             if(Memory.structures[structureId].requested) {
    //                 Memory.structures[structureId].requested = 0;
    //             }
    //         }
    //     }
    // }



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

    let harvesters = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'claimer');
    let reservers = _.filter(thisRoomCreeps, (creep) => creep.memory.role === 'reserver');
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
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 3) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if (longDistanceMinersRequired > 0) {
                //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
                let newName = 'LongDistanceMiner' + Game.time;

                spawn.spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'longdistanceminer' } });
            }
            else if (builders.length < 2) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 2) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (claimers.length < 1 && Memory.claiming && Memory.claiming.claimRoom) {
                let newName = 'Claimer' + Game.time;
                spawn.spawnCreep([CLAIM, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'claimer' } });

            }
            else if (reservers.length < 1 &&  Game.spawns['Spawn1'].room.memory.reserving && Game.spawns['Spawn1'].room.memory.reserving.reserveRoom) {
                let newName = 'Reserver' + Game.time;
                spawn.spawnCreep([CLAIM, CLAIM, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'reserver' } });

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
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (couriers.length < 1) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else if(harvesters.length < 2) {
                //console.log("111");
                let newName = 'Harvester' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'harvester' } });
            }
            else if (builders.length < 1) {
                let newName = 'Builder' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'builder', building: false } });

            }
            else if (upgraders.length < 1) {
                let newName = 'Upgrader' + Game.time;
                spawn.spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'upgrader', building: false } });

            }
            else if (couriers.length < 2) {
                let newName = 'Courier' + Game.time;
                spawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                    { memory: { roomOrigin : room.name, role: 'courier', building: false } });

            }
            else {
                let invader = InvasionControl.createNextInvader();
                if(invader) {
                    let newName = 'Ganger' + Game.time;
                    spawn.spawnCreep(invader.config, newName,
                        { memory: { roomOrigin : room.name, role: invader.role } });
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
            roleBuilderLvl5.run(creep);
        }
        if (creep.memory.role === 'upgrader') {
            roleUpgraderLvl3.run(creep);
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
        if (creep.memory.role === 'reserver') {
            roleReserverLvl5.run(creep);
        }
        if (creep.memory.role === 'courier') {
            roleCourierLvl5.run(creep);
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
    }
}

function ProcessCreepsOnDeathEffects() {
    for(let creepName in Memory.creeps) {
        if(Memory.creeps[creepName].onDeathEffect === true && !Game.creeps[creepName]) {
            if (Memory.creeps[creepName].role === 'courier') {
                roleCourierLvl5.processOnDeathEffect(creepName);
                delete Memory.creeps[creepName];
            }
        }

    }
}
