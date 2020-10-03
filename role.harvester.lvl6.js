let pathfinding = require('pathfinding');

let roleHarvesterLvl6 = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(!creep.id) {
            return;
        }
        let targetPosition;
        //console.log('---');
        if(creep.memory.targetPosition === undefined) {
            // console.log('000');
            let harvestContainers = creep.room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_CONTAINER
                    && Memory.structures['id'+structure.id]
                    && Memory.structures['id'+structure.id].containerType === 'Harvest'
                    && (!Memory.structures['id'+structure.id].harvester
                        || !Game.getObjectById(Memory.structures['id'+structure.id].harvester)
                        || (Game.getObjectById(Memory.structures['id'+structure.id].harvester).ticksToLive < (Game.getObjectById(Memory.structures['id'+structure.id].harvester).memory.ticksBeforeWork)))
            });
            if(harvestContainers && harvestContainers.length > 0) {
                targetPosition = harvestContainers[0].pos;
                creep.memory.targetPosition = {x: targetPosition.x, y: targetPosition.y};
                creep.memory.containerId = harvestContainers[0].id;
                // console.log('111');
                Memory.structures['id'+harvestContainers[0].id].harvester = creep.id;
            }
        }
        else {
            targetPosition = new RoomPosition(creep.memory.targetPosition.x, creep.memory.targetPosition.y, creep.room.name);
        }
        if(targetPosition) {
            if(!targetPosition.isEqualTo(creep.pos)) {
                creep.moveTo(targetPosition);
            }
            if(targetPosition.isEqualTo(creep.pos)) {
                let source;
                if(!creep.memory.sourceId) {
                    source = creep.pos.findClosestByRange(FIND_SOURCES);
                    creep.memory.sourceId = source.id;
                }
                else {
                    source = Game.getObjectById(creep.memory.sourceId);
                }
                let transferredThisTurn = false;
                let container = Game.getObjectById(creep.memory.containerId);
                let link = undefined;
                if(creep.memory.linkId) {
                    link = Game.getObjectById(creep.memory.linkId)
                }
                else {
                    let links = creep.room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y-1, creep.pos.x-1, creep.pos.y+1, creep.pos.x+1, true);
                    for(let linkIndex in links) {
                        if(links[linkIndex].structure.structureType === STRUCTURE_LINK && Memory.structures['id'+links[linkIndex].structure.id].linkType === 'Harvest') {
                            link = links[linkIndex].structure;
                            creep.memory.linkId = link.id;
                        }
                    }
                }
                if(link && link.store.getFreeCapacity(RESOURCE_ENERGY) !== 0) {
                    if(link.store.getFreeCapacity(RESOURCE_ENERGY) > creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
                        creep.withdraw(container, RESOURCE_ENERGY, Math.min(container.store.getUsedCapacity(), creep.store.getFreeCapacity(), (link.store.getFreeCapacity(RESOURCE_ENERGY)-creep.store.getUsedCapacity())));
                    }
                    creep.transfer(link, RESOURCE_ENERGY);
                    transferredThisTurn = true;
                }
                else if(container.store.getFreeCapacity() !== 0) {
                    if(creep.store.getFreeCapacity() === 0) {
                        creep.transfer(container, RESOURCE_ENERGY);
                        transferredThisTurn = true;
                    }
                }
                if(creep.store.getFreeCapacity() !== 0 || transferredThisTurn) {
                    let res = creep.harvest(source);
                    if(res === OK) {
                        if(!creep.memory.ticksBeforeWork && creep.memory.timeBorn) {
                            creep.memory.ticksBeforeWork = Game.time - creep.memory.timeBorn;
                        }
                    }
                }

            }
        }
    }
};

module.exports = roleHarvesterLvl6;