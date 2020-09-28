var pathfinding = {

    maxCachedPaths : 100,
    cachePathClearInterval : 100,
    /** @param {Creep} creep
     *  @param {RoomPosition} targetPos
     *  @param {number} radius
     * **/
    modMoveTo : function (creep, targetPos, radius) {

        //console.log(JSON.stringify(targetPos));
        // if(targetPos.pos) {
        //     targetPos = targetPos.pos;
        // }
        let forceNewPath = false;
        if(!creep.memory.prevPosition) {
            creep.memory.prevPosition = {x : creep.pos.x, y : creep.pos.y, roomName : creep.room.name};
        }
        if(!creep.memory.prevPosition.roomName) {
            creep.memory.prevPosition.roomName = creep.room.name;
        }
        if(!creep.memory.ticksStuck) {
            creep.memory.ticksStuck = 0;
        }
        //console.log(JSON.stringify(creep.memory.prevPosition));
        if(creep.pos.isEqualTo(new RoomPosition(creep.memory.prevPosition.x, creep.memory.prevPosition.y, creep.memory.prevPosition.roomName))) {
            creep.memory.ticksStuck++;
        }
        else {
            creep.memory.ticksStuck = 0;
        }
        if(creep.memory.ticksStuck > 2) {
            forceNewPath = true;
        }

        // console.log('===================================================');
        // console.log(creep.memory.role + ' ' + creep.id);
        // console.log('force new path: ' + forceNewPath);
        if(!forceNewPath
            && creep.memory.currentPath
            && creep.memory.currentPath.destination.x === targetPos.x
            && creep.memory.currentPath.destination.y === targetPos.y
            && creep.memory.currentPath.destination.roomName === targetPos.roomName
            && creep.memory.currentPath.destination.radius === radius
        ) {
            // console.log('found path in creep cache');
            let currentPath = undefined;

            try {
                currentPath = Room.deserializePath(creep.memory.currentPath.path);
                // currentPath = JSON.parse(creep.memory.currentPath.path);
                creep.moveByPath(currentPath);
            }
            catch {
                // console.log('ERROR in CREEP memory path');
                creep.memory.currentPath = undefined;
            }

        }
        else {
            if(!creep.room.memory.cachePath) {
                creep.room.memory.cachePath = [];
            }
            let cachedPath = undefined;
            if(!forceNewPath) {
                cachedPath = _.filter(creep.room.memory.cachePath,
                    (path) => path != null
                        && path.start.x === creep.pos.x
                        && path.start.y === creep.pos.y
                        && path.radius === radius
                        && path.destination.x === targetPos.x
                        && path.destination.y === targetPos.y
                );
            }

            if(cachedPath && cachedPath.length > 0) {
                // console.log('found path in ROOM cache');
                let currentPath = undefined;
                cachedPath = cachedPath[0];
                let index = creep.room.memory.cachePath.indexOf(cachedPath);
                try {

                    currentPath = Room.deserializePath(cachedPath.path);
                    // currentPath = JSON.parse(cachedPath.path);

                    creep.memory.currentPath = {};
                    creep.memory.currentPath.destination = {x : cachedPath.start.x, y : cachedPath.start.y, roomName : cachedPath.start.room, radius : radius};
                    creep.memory.currentPath.path = currentPath;
                    creep.room.memory.cachePath[index].timesUsed++;

                    creep.moveByPath(currentPath);
                }
                catch {
                    // console.log('ERROR in ROOM memory path');
                    creep.memory.currentPath = undefined;
                    creep.room.memory.cachePath.splice(index, 1);
                    cachedPath = undefined;
                }

            }
            if(!cachedPath || cachedPath.length === 0) {
                // console.log('creating new path');
                let newPath = this.createInnerPath(creep, creep.room, creep.pos, targetPos, radius, !forceNewPath);

                let serialisedPath = Room.serializePath(newPath);
                // let serialisedPath = JSON.stringify(newPath.path);
                creep.memory.currentPath = {};
                creep.memory.currentPath.destination = {x : targetPos.x, y : targetPos.y, roomName : targetPos.roomName, radius : radius};
                creep.memory.currentPath.path = serialisedPath;

                if(!forceNewPath) {
                    // if(creep.room.memory.cachePath.length > this.maxCachedPaths) {
                    //     let min = Number.MAX_VALUE;
                    //     let minPath = undefined;
                    //     for(let path in creep.room.memory.cachePath) {
                    //         if(creep.room.memory.cachePath[path].timesUsed < min) {
                    //             minPath = path;
                    //             min = creep.room.memory.cachePath[path].timesUsed;
                    //         }
                    //     }
                    //     creep.room.memory.cachePath.splice(minPath, 1);
                    // }
                    creep.room.memory.cachePath.push({
                        start : {x : creep.pos.x, y : creep.pos.y, room : creep.room.name},
                        destination : {x : targetPos.x, y : targetPos.y, room : targetPos.roomName},
                        radius : radius,
                        timesUsed : 1,
                        path : serialisedPath,
                        timeCreated : Game.time
                    });
                }

                creep.moveByPath(newPath);
            }
        }
        creep.memory.prevPosition = {x : creep.pos.x, y : creep.pos.y, roomName : creep.room.name};
        // console.log('===================================================');
    },

    /** @param {Creep} creep
     *  @param {Room} room
     *  @param {RoomPosition} startPos
     *  @param {RoomPosition} endPos
     *  @param {number} radius
     *  @param {boolean} ignoreCreeps
     * **/
    createInnerPath : function(creep, room, startPos, endPos, radius, ignoreCreeps) {
        let creepMoveCoefficient = this.getCreepMoveCoefficient(creep);
        let newCostMatrix = this.createCostMatrix(room, creepMoveCoefficient, ignoreCreeps);
        let newPath = room.findPath(startPos, new RoomPosition(endPos.x, endPos.y, endPos.roomName), {
            costCallback : function(roomName, costMatrix) {
                // console.log('callback ' + roomName + ' = ' + (roomName === room.name));
                if(roomName === room.name) {
                    return newCostMatrix;
                }
                else {
                    return costMatrix;
                }
            },
            maxRooms : 1,
            range : radius
        });
        // console.log(JSON.stringify(newPath));
        return newPath;
    },

    /** @param {Room} room
     *  @param {number} creepMoveCoefficient
     *  @param {boolean} ignoreCreeps
     * **/
    createCostMatrix : function (room, creepMoveCoefficient, ignoreCreeps) {

        // console.log('----K='+creepMoveCoefficient);
        if(ignoreCreeps === undefined) {
            ignoreCreeps = true;
        }

        if(!room.memory.costMatrixCache) {
            room.memory.costMatrixCache = [];
        }
        let cachedMatrix = undefined;
        if(ignoreCreeps) {
            cachedMatrix = room.memory.costMatrixCache[creepMoveCoefficient];
        }
        if(cachedMatrix) {
            let deserializedMatrix = PathFinder.CostMatrix.deserialize(JSON.parse(cachedMatrix));
            // console.log('matrix found in cache ' + deserializedMatrix.get(26, 17));
            return deserializedMatrix;
        }
        else {
            let newMatrix = new PathFinder.CostMatrix;
            let roomTerrain = room.getTerrain();
            let roomStructures = room.find(FIND_STRUCTURES);
            for(let x = 0; x < 50; x++) {
                for(let y = 0; y < 50; y++) {
                    let tile = roomTerrain.get(x, y);
                    let cost =
                        tile === TERRAIN_MASK_WALL  ? 255 : // wall  => unwalkable
                        tile === TERRAIN_MASK_SWAMP ?   5*creepMoveCoefficient : // swamp => weight:  5
                                                        creepMoveCoefficient ; // plain => weight:  1
                    newMatrix.set(x,y,cost);
                }
            }
            for(let structureInd in roomStructures) {
                let structure = roomStructures[structureInd];
                if(structure.structureType === STRUCTURE_STORAGE
                    || structure.structureType === STRUCTURE_SPAWN
                    || structure.structureType === STRUCTURE_TOWER
                    || structure.structureType === STRUCTURE_SPAWN
                    || structure.structureType === STRUCTURE_EXTENSION
                    || structure.structureType === STRUCTURE_CONTROLLER
                    || structure.structureType === STRUCTURE_EXTRACTOR
                    || structure.structureType === STRUCTURE_FACTORY
                    || structure.structureType === STRUCTURE_KEEPER_LAIR
                    || structure.structureType === STRUCTURE_LAB
                    || structure.structureType === STRUCTURE_LINK
                    || structure.structureType === STRUCTURE_NUKER
                    || structure.structureType === STRUCTURE_OBSERVER
                    || structure.structureType === STRUCTURE_POWER_BANK
                    || structure.structureType === STRUCTURE_POWER_SPAWN
                    || structure.structureType === STRUCTURE_TERMINAL
                    || structure.structureType === STRUCTURE_WALL
                    || (!structure.my && structure.structureType === STRUCTURE_RAMPART)
                    ) {

                    newMatrix.set(structure.pos.x, structure.pos.y, 255);
                }
                else if(structure.structureType === STRUCTURE_ROAD) {
                    newMatrix.set(structure.pos.x, structure.pos.y, Math.ceil(creepMoveCoefficient / 2.0));
                }
            }
            if(!ignoreCreeps) {
                let creeps = room.find(FIND_CREEPS);
                for(let creepName in creeps) {
                    let creep = creeps[creepName];
                    newMatrix.set(creep.pos.x, creep.pos.y, 255);
                }
            }
            for(let flagName in Game.flags) {
                if(Game.flags[flagName].pos.roomName === room.name && Game.flags[flagName].color === COLOR_PURPLE) {
                    newMatrix.set(Game.flags[flagName].pos.x, Game.flags[flagName].pos.y, 255);
                }
            }
            let serializedMatrix = newMatrix.serialize();
            //console.log('new matrix: ' + JSON.stringify(serializedMatrix));
            room.memory.costMatrixCache[creepMoveCoefficient] = JSON.stringify(serializedMatrix);
            return newMatrix;
        }
    },

    /** @param {Creep} creep **/
    getCreepMoveCoefficient : function (creep) {
        let moveParts = 0.0;
        let nonMoveParts = 0.0;
        for(let part in creep.body) {
            if(creep.body[part].type === MOVE) {
                moveParts+=1.0;
            }
            else {
                nonMoveParts+=1.0;
            }
        }
        return this.simplifyCoefficient(Math.ceil(nonMoveParts/moveParts));
    },

    /** @param {number} coef **/
    simplifyCoefficient : function(coef) {

        if(coef == 1) {
            return 1;
        }
        if(coef == 2) {
            return 2;
        }
        if(coef == 3) {
            return 3;
        }
        if(coef == 4) {
            return 2;
        }
        if(coef == 5) {
            return 5;
        }
        if(coef == 7) {
            return 7;
        }
        if(coef == 8) {
            return 2;
        }
        if(coef == 9) {
            return 9;
        }
        if(coef == 10) {
            return 5;
        }
        if(coef == 11) {
            return 11;
        }
        if(coef == 0) {
            return 0;
        }
        return coef;
    },

    clearUnusedPaths : function (room) {
        let currentTick = Game.time;
        let arrayOfPathToClear = [];
        for(let path in room.memory.cachePath) {
            if (!room.memory.cachePath[path].timeCreated || (currentTick - room.memory.cachePath[path].timeCreated > this.cachePathClearInterval)) {
                arrayOfPathToClear.push({path: path, used: room.memory.cachePath[path].timesUsed});
            }
        }
        arrayOfPathToClear.sort((a, b) => b.used-a.used);
        for(let i = this.maxCachedPaths; i<arrayOfPathToClear.length; i++) {
            room.memory.cachePath.splice(arrayOfPathToClear[i], 1);
        }
    }
};


module.exports = pathfinding;