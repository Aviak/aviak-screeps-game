

var roleBuilder = require('role.builder');
var roleSimpleWorker = require('role.simpleWorker');
var roleBuilderLvl3 = require('role.builder.lvl3');
var roleCourierLvl3 = require('role.courier.lvl3');
var roleHarvesterLvl3 = require('role.harvester.lvl3');
var roleUpgraderLvl3 = require('role.upgrader.lvl3');
var roleLongDistanceMinerLvl3 = require('role.longdistanceminer.lvl3');
var InvasionControl = require('InvasionControl');
var roleClaimerLvl3 = require('role.claimer.lvl3');

module.exports.loop = function () {

    let rooms = _.filter(Game.rooms, (room) => room.controller.my);
    let roomLevel = rooms[0].controller.level;
    if(roomLevel === 1) {
        RunLevel1();
    }
    else if(roomLevel === 2) {
        RunLevel2();
    }
    else if(roomLevel === 3) {
        RunLevel3();
    }
    else if(roomLevel === 4) {
        RunLevel4();
    }
    else {
        RunLatest();
    }

}

function RunLevel1() {

    if (Game.time % 250) {
        for (name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    let workers = _.filter(Game.creeps, (creep) => creep.memory.role === 'simpleWorker');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    //console.log('Workers: ' + workers.length)
    if(workers.length <= 5) {
        //console.log("111");
        let newName = 'Worker' + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
            { memory: { role: 'simpleWorker', harvesting: false, upgrading: false } });
    }
    else if (builders.length <= 3) {
        let newName = 'Builder' + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
            { memory: { role: 'builder', building: false } });

    }

    if (Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            'oh no ' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            { align: 'left', opacity: 0.8 });
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role === 'simpleWorker') {
            roleSimpleWorker.run(creep);
        }
        if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
        }
    }
}

function RunLevel2() {
    RunLevel1();
}

function RunLevel3() {
    if (Game.time % 250) {
        for (name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
        InitClearObjectsMemory();
    }

    let towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
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

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl3.getMiningLocations();
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    var invasion = false;
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
    if(!invasion) {
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 4) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if (longDistanceMinersRequired > 0) {
            console.log('required ' + longDistanceMinersRequired + 'long distance miners');
            newName = 'LongDistanceMiner' + Game.time;

            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'longdistanceminer' } });
        }
        else if (builders.length < 4) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 4) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (claimers.length < 1) {
            let newName = 'Claimer' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CLAIM, MOVE], newName,
                { memory: { role: 'claimer' } });

        }

        if (Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                'oh no ' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }
    else {
        console.log('INVASION MODE');
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 2) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else {
            let invader = InvasionControl.createNextInvader();
            if(invader) {
                let newName = 'Ganger' + Game.time;
                Game.spawns['Spawn1'].spawnCreep(invader.config, newName,
                    { memory: { role: invader.role } });
            }

        }
        InvasionControl.run();
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
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

function RunLevel4() {
    if (Game.time % 250) {
        for (name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
        InitClearObjectsMemory();
    }

    let towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
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

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl3.getMiningLocations();
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    var invasion = false;
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
    if(!invasion) {
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 2) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 4) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if (longDistanceMinersRequired > 0) {
            //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
            let newName = 'LongDistanceMiner' + Game.time;

            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'longdistanceminer' } });
        }
        else if (builders.length < 4) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 4) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (claimers.length < 1 && Memory.claiming && Memory.claiming.claimRoom) {
            let newName = 'Claimer' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CLAIM, MOVE], newName,
                { memory: { role: 'claimer' } });

        }

        if (Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                'oh no ' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }
    else {
        console.log('INVASION MODE');
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 2) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else {
            let invader = InvasionControl.createNextInvader();
            if(invader) {
                let newName = 'Ganger' + Game.time;
                Game.spawns['Spawn1'].spawnCreep(invader.config, newName,
                    { memory: { role: invader.role } });
            }

        }
        InvasionControl.run();
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
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

function RunLatest() {
    if (Game.time % 250) {
        for (name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    if(Game.time % 10) {
        InitClearObjectsMemory();
    }

    let towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
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

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    let couriers = _.filter(Game.creeps, (creep) => creep.memory.role === 'courier');
    let claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer');
    let longDistanceMiningLocations = roleLongDistanceMinerLvl3.getMiningLocations();
    let longDistanceMinersRequired = 0;
    for (let i of longDistanceMiningLocations) {
        longDistanceMinersRequired += i.maxMiners;
    }
    var invasion = false;
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
    if(!invasion) {
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 2) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 4) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if (longDistanceMinersRequired > 0) {
            //console.log('required ' + longDistanceMinersRequired + 'long distance miners');
            let newName = 'LongDistanceMiner' + Game.time;

            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'longdistanceminer' } });
        }
        else if (builders.length < 4) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 4) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (claimers.length < 1 && Memory.claiming && Memory.claiming.claimRoom) {
            let newName = 'Claimer' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CLAIM, MOVE], newName,
                { memory: { role: 'claimer' } });

        }

        if (Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                'oh no ' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                { align: 'left', opacity: 0.8 });
        }
    }
    else {
        console.log('INVASION MODE');
        if(harvesters.length < 1) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (couriers.length < 1) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else if(harvesters.length < 2) {
            //console.log("111");
            let newName = 'Harvester' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'harvester' } });
        }
        else if (builders.length < 1) {
            let newName = 'Builder' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'builder', building: false } });

        }
        else if (upgraders.length < 1) {
            let newName = 'Upgrader' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'upgrader', building: false } });

        }
        else if (couriers.length < 2) {
            let newName = 'Courier' + Game.time;
            Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], newName,
                { memory: { role: 'courier', building: false } });

        }
        else {
            let invader = InvasionControl.createNextInvader();
            if(invader) {
                let newName = 'Ganger' + Game.time;
                Game.spawns['Spawn1'].spawnCreep(invader.config, newName,
                    { memory: { role: invader.role } });
            }

        }
        InvasionControl.run();
    }


    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
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
