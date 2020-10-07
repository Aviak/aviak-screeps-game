let pathfinding = require('pathfinding');

let roleMinerLvl6 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.id) {
            return;
        }
        let targetPosition;
        //console.log('---');
        if(creep.memory.targetPosition === undefined) {
            // console.log('000');
            let miningContainers = creep.room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_CONTAINER
                    && Memory.structures['id'+structure.id]
                    && Memory.structures['id'+structure.id].containerType === 'Minerals'
                    && (!Memory.structures['id'+structure.id].harvester
                        || !Game.getObjectById(Memory.structures['id'+structure.id].miner)
                        || (Game.getObjectById(Memory.structures['id'+structure.id].miner).ticksToLive < (Game.getObjectById(Memory.structures['id'+structure.id].miner).memory.ticksBeforeWork)))
            });
            if(miningContainers && miningContainers.length > 0) {
                targetPosition = miningContainers[0].pos;
                creep.memory.targetPosition = {x: targetPosition.x, y: targetPosition.y};
                creep.memory.containerId = miningContainers[0].id;
                // console.log('111');
                Memory.structures['id'+miningContainers[0].id].miner = creep.id;
            }
        }
        else {
            targetPosition = new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.room.name);
        }
        if(targetPosition) {
            if(!targetPosition.isEqualTo(creep.pos)) {
                // creep.moveTo(targetPosition);
                pathfinding.modMoveTo(creep, targetPosition, 0);
            }
            let mineral = undefined;
            if(!creep.memory.mineralId) {
                mineral = creep.pos.findClosestByRange(FIND_MINERALS);
                creep.memory.mineralId = mineral.id;
            }
            else {
                mineral = Game.getObjectById(creep.memory.mineralId);
            }
            // let resourceType = undefined;
            // if(!creep.memory.resourceType) {
            //     let mineral = undefined;
            //     if(!creep.room.memory.mineralId) {
            //         let minerals = creep.room.find(FIND_MINERALS);
            //         mineral = minerals[0];
            //         creep.room.memory.mineralId = mineral.id;
            //     }
            //     resourceType = mineral.mineralType;
            //     creep.memory.resourceType = resourceType;
            // }
            // if(container.store.getFreeCapacity() !== 0) {
            //     if(creep.store.getFreeCapacity() === 0) {
            //         creep.transfer(container, resourceType);
            //         transferredThisTurn = true;
            //     }
            // }
            // if(creep.store.getFreeCapacity() !== 0 || transferredThisTurn) {
            let res = creep.harvest(mineral);
            if(res === OK) {
                if(!creep.memory.ticksBeforeWork && creep.memory.timeBorn) {
                    creep.memory.ticksBeforeWork = Game.time - creep.memory.timeBorn;
                }
            }
            // }
        }
    }
};

module.exports = roleMinerLvl6;