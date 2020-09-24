var invasionControl = {

    run: function() {
        if(!Memory.invasionParameters) {
            Memory.invasionParameters = {gangNumerator : 0, gangs: [], invadeRoom : ''};
        }
        if(Game.rooms[Memory.invasionParameters.invadeRoom] && Game.rooms[Memory.invasionParameters.invadeRoom].controller.owner === '') {
            Memory.invasionParameters.invasionDone = true;
        }
        let ranged_v1 = _.filter(Game.creeps, (creep) => creep.memory.role === 'ranged_v1' && !creep.memory.gang);
        var currentGang;
        if(Memory.invasionParameters.gangs.length === 0) {
            currentGang = {creeps: [], status: 'forming'};
        }
        else {
            currentGang = Memory.invasionParameters.gangs[Memory.invasionParameters.gangNumerator];
        }
        const gangSize = 3;
        for(let creepName in ranged_v1) {
            let creep = ranged_v1[creepName];
            if(currentGang.creeps.length >= gangSize) {
                Memory.invasionParameters.gangs[Memory.invasionParameters.gangNumerator] = currentGang;
                Memory.invasionParameters.gangNumerator++;
                currentGang = {creeps: [], status: 'forming'};
            }
            currentGang.creeps.push(creep.id);
            creep.memory.gang = Memory.invasionParameters.gangNumerator;
        }
        Memory.invasionParameters.gangs[Memory.invasionParameters.gangNumerator] = currentGang;
        for(let currentGangName in Memory.invasionParameters.gangs) {
            let currentGang = Memory.invasionParameters.gangs[currentGangName];
            if(currentGang.status === 'forming') {
                let allInPosition = true;
                for(let creepId in currentGang.creeps) {
                    let creep = Game.getObjectById(currentGang.creeps[creepId]);
                    if(creep) {
                        if(creep.pos.getRangeTo(Game.flags.Rally) > 3) {
                            allInPosition = false;
                            creep.moveTo(Game.flags.Rally);
                        }
                    } else {
                        currentGang.creeps.splice(creepId, 1);
                    }
                }
                if(allInPosition) {
                    currentGang.status = 'attacking';
                }
            }
            if(currentGang.status === 'attacking') {
                for(let creepId in currentGang.creeps) {
                    let creep = Game.getObjectById(currentGang.creeps[creepId]);
                    if(creep) {
                        if(creep.pos.roomName !== Memory.invasionParameters.invadeRoom) {
                            let exitCode = creep.room.findExitTo(Memory.invasionParameters.invadeRoom);
                            let exitPos = creep.pos.findClosestByRange(exitCode);
                            creep.moveTo(exitPos);
                        }
                        else {
                            let flags = creep.room.find(FIND_FLAGS, {
                                filter: (flag) => flag.color === COLOR_BROWN
                            });
                            let target = undefined;
                            let objects = creep.room.find(FIND_STRUCTURES, {
                                filter : (structure) => structure.pos.isEqualTo(flags[0].pos)
                            });
                            if(objects && objects.length > 0) {
                                target = objects[0];
                            }
                            if(!target) {
                                target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                            }
                            if(!target) {
                                target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                                    filter : (structure) => structure.structureType === STRUCTURE_SPAWN
                                });
                                if(!target) {
                                    target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
                                }
                            }
                            if(target) {
                                if(creep.pos.getRangeTo(target) > 1) {
                                    creep.moveTo(target);
                                }
                                if(creep.pos.getRangeTo(target) <= 3) {
                                    creep.rangedAttack(target);
                                }
                            }

                        }
                    } else {
                        currentGang.creeps.splice(creepId, 1);
                    }
                }
            }
            Memory.invasionParameters.gangs[currentGangName] = currentGang;
        }
    },

    createNextInvader: function () {
        return {role: 'ranged_v1', config:[RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, TOUGH]}
    }
};


module.exports = invasionControl;