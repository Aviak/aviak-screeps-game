let roomDefenseControl = {
    getRoomDefenseRegionMatrix: function(room) {
        if(!room.memory.defenseControl) {
            room.memory.defenseControl = {defenseControlActive : false};
        }
        if(!room.memory.defenseControl.defenseControlActive) {
            return undefined;
        }
        if(room.memory.defenseControl.defenseRegionMatrixCache) {
            return JSON.parse(room.memory.defenseControl.defenseRegionMatrixCache);
        }
        else {
            let defenseRegionMatrix = Array(50);
            let roomTerrain = room.getTerrain();
            for(let i=0; i<50; i++) {
                defenseRegionMatrix[i] = Array(50);
                for(let j=0; j<50; j++) {
                    defenseRegionMatrix[i][j] = (roomTerrain.get(i,j) === TERRAIN_MASK_WALL) ? 255 : 1;
                }
            }
            let rampartsAndWalls = room.find(FIND_STRUCTURES, {
                filter : (structure) => structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART
            });
            for(let structureIndex in rampartsAndWalls) {
                let structurePos = rampartsAndWalls[structureIndex].pos;
                defenseRegionMatrix[structurePos.x][structurePos.y] = 255;
            }
            for(let i=0; i<50; i++) {
                if(defenseRegionMatrix[0][i] === 1) {
                    this.recFillOuterRegion(defenseRegionMatrix, 0, i);
                }
                if(defenseRegionMatrix[i][0] === 1) {
                    this.recFillOuterRegion(defenseRegionMatrix, i, 0);
                }
                if(defenseRegionMatrix[49][i] === 1) {
                    this.recFillOuterRegion(defenseRegionMatrix, 49, i);
                }
                if(defenseRegionMatrix[i][49] === 1) {
                    this.recFillOuterRegion(defenseRegionMatrix, i, 49);
                }
            }
            room.memory.defenseControl.defenseRegionMatrixCache = JSON.stringify(defenseRegionMatrix);
            return defenseRegionMatrix;
        }
    }
    ,
    recFillOuterRegion: function(matrix, x, y) {
        matrix[x][y] = 5;
        if(x > 0 && matrix[x-1][y] === 1) {
            this.recFillOuterRegion(matrix, x-1, y);
        }
        if(x < 49 && matrix[x+1][y] === 1) {
            this.recFillOuterRegion(matrix, x+1, y);
        }
        if(y > 0 && matrix[x][y-1] === 1) {
            this.recFillOuterRegion(matrix, x, y-1);
        }
        if(y < 49 && matrix[x][y+1] === 1) {
            this.recFillOuterRegion(matrix, x, y+1);
        }
    }
};


module.exports = roomDefenseControl;