

var roleBuilder = require('role.builder');
var roleSimpleWorker = require('role.simpleWorker')

module.exports.loop = function () {

    let rooms = _.filter(Game.rooms, (room) => room.controller.my);
    let roomLevel = rooms[0].controller.level;
    if(roomLevel === 1) {
        RunLevel1();
    }
    else if(roomLevel === 2) {
        RunLevel2();
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

function RunLatest() {
    if (Game.time % 250) {
        for (name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                //console.log('Clearing non-existing creep memory:', name);
            }
        }
    }

    InitClearObjectsMemory();

    let towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === STRUCTURE_TOWER
    });
    for(let tower in towers) {
        let closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            tower.attack(closestHostile);
        }
    }

    let workers = _.filter(Game.creeps, (creep) => creep.memory.role === 'simpleWorker');
    let builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    //console.log('Workers: ' + workers.length)
    if(workers.length <= 5) {
        //console.log("111");
        let newName = 'Worker' + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, CARRY, MOVE, MOVE], newName,
            { memory: { role: 'simpleWorker', harvesting: false, upgrading: false } });
    }
    else if (builders.length <= 3) {
        let newName = 'Builder' + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName,
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
            if(Memory.structures['id'+containers[cont].id] === undefined) {
                Memory.structures['id'+containers[cont].id] = {containerType: ''};
            }
        }
    }
}
