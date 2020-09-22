var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleSimpleWorker = require('role.simpleWorker')

module.exports.loop = function () {

    var tower = Game.getObjectById('53d18f0dc25b2141c1388dda');
    if(tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
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
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE, MOVE], newName,
            { memory: { role: 'simpleWorker', harvesting: false, upgrading: false } });
    }
    else if (builders.length <= 3) {
        let newName = 'Builder' + Game.time;
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE, MOVE], newName,
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