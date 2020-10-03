let pathfinding = require('pathfinding');

let roleOperatorLvl6 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.memory.onDeathEffect) {
            creep.memory.onDeathEffect = true;
        }

        if(creep.store.getUsedCapacity() > 0) {
            let target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            else {
                if(creep.store.getUsedCapacity(RESOURCE_ENERGY) === creep.store.getUsedCapacity()) {
                    let containers = creep.room.find(FIND_STRUCTURES, {
                        filter : (structure) => structure.structureType === STRUCTURE_CONTAINER
                            && Memory.structures['id'+structure.id]
                            && Memory.structures['id'+structure.id].containerType === 'Request'
                            && structure.store.getFreeCapacity() !== 0
                    });
                    if(containers && containers.length > 0) {
                        //target = _.minBy(targets, (e) => e.store.getUsedCapacity())
                        let min = 99999;
                        for(let i in containers) {
                            if (containers[i].store.getUsedCapacity() < min) {
                                min = containers[i].store.getUsedCapacity();
                                target = containers[i];
                            }
                        }
                    }
                }
            }
            if(target) {
                creep.memory.target = target.id;
                if (creep.pos.getRangeTo(target) > 1) {
                    //if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    //creep.moveTo(target);
                    pathfinding.modMoveTo(creep, target.pos, 1)
                    //console.log('---courier|not in range to put');
                }
                let result = creep.transfer(target, RESOURCE_ENERGY);
                if (result !== ERR_NOT_IN_RANGE) {
                    // console.log('---courier '+creep.id+' |put success ' + result);
                    creep.memory.target = undefined;
                }
            }
        }
        else {
            let target = undefined;
            if(creep.memory.target) {
                target = Game.getObjectById(creep.memory.target);
            }
            else {
                let links = creep.room.find(FIND_STRUCTURES, {
                    filter : (structure) => structure.structureType === STRUCTURE_LINK
                        && Memory.structures['id'+structure.id]
                        && Memory.structures['id'+structure.id].linkType === 'Request'
                        && (structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getCapacity()
                            || structure.store.getUsedCapacity(RESOURCE_ENERGY) === structure.store.getCapacity())

                });
                if(links && links.length > 0) {
                    target = links[0];
                }
            }
            if(target) {
                creep.memory.target = target.id;
                if (creep.pos.getRangeTo(target) > 1) {
                    pathfinding.modMoveTo(creep, target.pos, 1);
                    if (target instanceof Structure && (!creep.memory.requested || creep.memory.requested === 0)) {
                        creep.memory.requested = creep.store.getCapacity();
                        if (!Memory.structures['id' + target.id].requested) {
                            Memory.structures['id' + target.id].requested = 0;
                        }
                        Memory.structures['id' + target.id].requested += creep.store.getCapacity();
                    }
                }

                let result = creep.withdraw(target, RESOURCE_ENERGY);
                if (result === OK) {

                    Memory.structures['id' + target.id].requested -= creep.memory.requested;
                    creep.memory.requested = 0;
                    creep.memory.target = undefined;

                }
            }
        }
    },

    processOnDeathEffect : function(creepName) {
        if(Memory.creeps[creepName].target && Memory.creeps[creepName].requested > 0 && Memory.structures['id'+Memory.creeps[creepName].target]) {
            // console.log(Memory.creeps[creepName].target);
            Memory.structures['id'+Memory.creeps[creepName].target].requested -= Memory.creeps[creepName].requested;
            Memory.creeps[creepName].requested = 0;
            console.log('operator OnDeath effect ' + creepName);
        }

    },

    getBody : function (energyAvailable) {
        let cost = 0;
        let body = [];
        let addMove = true;
        while(cost+100<energyAvailable && cost < 1000) {
            body.push(CARRY);
            cost+=50;
            if(addMove) {
                body.push(MOVE);
                cost+=50;
            }
            addMove = !addMove;
        }
        // console.log(JSON.stringify(body));
        return body;
    }

};

module.exports = roleOperatorLvl6;