
(function(logic) {

/******************************************************************************
 ******************************************************************************
 *	Transformers
 ******************************************************************************
 ******************************************************************************/

var transformers = {
	
	//Modifies the height of vertices
	height: {
		enabled: false,
		active: false,
		direction: 1,
		func: function(closestVertex) {
			
			//Grab the width
			var width = mods[logic.currentMod].terrain.width+1;
			
			//How much to change the height
			var modifier = brush.strength * transformers.height.direction;
			
			//Grab our arrays for easy modification
			var positionArray = logic.plane.geometry.attributes.position.array;
			var modPositions = mods[logic.currentMod].terrain.heightMap;
			
			//Modify the vertices
			for (var i = -brush.size + 1; i <= brush.size - 1; i++)
				for (var n = -brush.size + 1; n <= brush.size - 1; n++)
					if (Math.floor((closestVertex+i*width) / width) ==
							Math.floor((closestVertex+i*width+n) / width)) {
						positionArray[(closestVertex+i*width+n)*3+2] += modifier;
						modPositions[closestVertex+i*width+n] += modifier;
					}
			
			//Make sure geometry is updated
			logic.plane.geometry.computeVertexNormals();
			logic.plane.geometry.attributes.position.needsUpdate = true;
			
		}
	},
	
	//Modifies the texture assigned to tiles
	//	TODO: clean this shit up, so hard to understand
	//				Width shouldn't be +1 as closestVertex should be converted right away...
	texture: {
		enabled: false,
		active: false,
		index: 1,
		func: function(closestVertex) {
			
			//Grab the width and height
			var width = mods[logic.currentMod].terrain.width;
			var height = mods[logic.currentMod].terrain.height;
			var wWidth = width+1;
			
			//Grab our brush size
			var size = brush.size;
			
			//Set our new tile
			var tileTextureIndex = transformers.texture.index;
			
			//Grab our arrays for easy modification
			var top = mods[logic.currentMod].terrain.tileMapTop;
			var bottom = mods[logic.currentMod].terrain.tileMapBottom;
			
			//Grab the prime location (center, where for even we're in bot right
			//		center)
			var primeIndex = closestVertex - Math.floor(closestVertex / wWidth);
			var primeRow = Math.floor(closestVertex / wWidth);
			var primeColumn = closestVertex % wWidth;
			
			//Grab our row min/max [+center]
			var minRow = primeRow - size,
					minRowCenter = Math.max(minRow+1, 0),
					
					maxRow = primeRow + size - 1,
					maxRowCenter = Math.min(maxRow-1, height - 1);
			
			//Grab our column min/max [+center]
			var minColumn = primeColumn - size,
					minColumnCenter = Math.max(minColumn+1, 0),
					
					maxColumn = primeColumn + size - 1,
					maxColumnCenter = Math.min(maxColumn-1, width - 1);
			
			//Reduce the row range (do this after, for sake of center)
			minRow = Math.max(minRow, 0);
			maxRow = Math.min(maxRow, height-1);
			
			//Reduce the column range (again, after, for sake of center)
			minColumn = Math.max(minColumn, 0);
			maxColumn = Math.min(maxColumn, width-1);
			
			//So we don't calculate it every time
			var centerExists = minColumnCenter <= maxColumnCenter &&
					minRowCenter <= maxRowCenter;
			
			//Variables we'll need in the loop
			var index, variation, randTile;
			
			//Loop through the entire brush area (we're limited to inbounds)
			for (var column = minColumn; column <= maxColumn; column++)
				for (var row = minRow; row <= maxRow; row++) {
					
					//Grab the index
					index = row*width + column;
					
					//A center doesn't exist or we're outside of it
					if (!centerExists || edgeOfBrush(row, column, minRow, maxRow,
							minRowCenter, maxRowCenter, minColumn, maxColumn, minColumnCenter,
							maxColumnCenter)) {
						
						//Push the top down
						//paintTile(bottom, logic.tileMapBottomContext, index*3, column, row, top[index*3], top[index*3+1], top[index*3+2]);
						
						//Get the variation; the rect defined by min/max row/column is
						//		treated as the the passed tile
						variation = getVariation(index, row, column, minRow, maxRow, minColumn, maxColumn);
						
						//Replace the top texture
						top[index*3+2] = variation[0];
						
						//Set our variations
						top[index*3] = variation[1];
						top[index*3+1] = variation[2];
						
						//Paint the tile
						logic.tileMapTopContext.fillStyle =
								buildColorFromTopTileMap(index*3);
						logic.tileMapTopContext.fillRect(column, row, 1, 1);
						
					//Center exists and we're in it
					} else {
						
						
						
						//Replace the top texture
						top[index*3+2] = transformers.texture.index;
						
						//Grab a random tile
						randTile = Mod.randomTile();
						
						//Set our variations
						top[index*3] = randTile[0];
						top[index*3+1] = randTile[1];
						
						//Paint the tile
						logic.tileMapTopContext.fillStyle =
								buildColorFromTopTileMap(index*3);
						logic.tileMapTopContext.fillRect(column, row, 1, 1);
						
					}
					
				}
			
			//Recalc & update
			logic.tileMapTopTexture.needsUpdate = true;
			logic.tileMapBottomTexture.needsUpdate = true;
			
		}
	}
};

//Send our transformers to an array for easy & efficient use
var transformersArray = [];
for (var transformer in transformers)
	if(transformers.hasOwnProperty(transformer))
		transformersArray.push(transformers[transformer]);;

/******************************************************************************
 ******************************************************************************
 *	Objects
 ******************************************************************************
 ******************************************************************************/

var brush = {
	size: 1,
	strength: 8,
	type: 'square'
};

//Objects from outside (DOM or otherwise)
var box;
var camera;

/******************************************************************************
 ******************************************************************************
 *	Support
 ******************************************************************************
 ******************************************************************************/

function paintTile(uint, context, index, column, row, r, g, b) {
	uint[index] = r;
	uint[index+1] = g;
	uint[index+2] = b;
	
	//console.log(r, g, b);
	
	context.fillStyle = '#' + pad(r, 2, 16) + pad(g, 2, 16) + pad(b, 2, 16);
	context.fillRect(column, row, 1, 1);
}

//Corner for flags
var TOP_LEFT = 1,
		TOP_RIGHT = 2,
		BOTTOM_LEFT = 4,
		BOTTOM_RIGHT = 8,
		
		//Combined directions
		TOP = TOP_LEFT | TOP_RIGHT,
		BOTTOM = BOTTOM_LEFT | BOTTOM_RIGHT,
		LEFT = TOP_LEFT | BOTTOM_LEFT,
		RIGHT = TOP_RIGHT | BOTTOM_RIGHT,
		ALL = TOP | BOTTOM;

//The corners a tile variation has (look at a texture)
//	[column][row], where [0][0] is the bottom left
var tileRelations = [
	[TOP, TOP_LEFT, TOP_RIGHT, ALL],
	[TOP | BOTTOM_RIGHT, TOP_LEFT | BOTTOM_RIGHT, RIGHT, BOTTOM_RIGHT],
	[TOP | BOTTOM_LEFT, LEFT, TOP_RIGHT | BOTTOM_LEFT, BOTTOM_LEFT],
	[ALL, BOTTOM | TOP_LEFT, BOTTOM | TOP_RIGHT, BOTTOM]
];

//The neighbouring tiles laid out in an octothorpe and the corners/directions we're interested in
var neighbors = [
	[-1, -1, BOTTOM_RIGHT], [-1, 0, BOTTOM], [-1, 1, BOTTOM_LEFT],
	[ 0, -1, RIGHT],                         [ 0, 1, LEFT],
	[ 1, -1, TOP_RIGHT],    [ 1, 0, TOP],    [ 1, 1, TOP_LEFT]
];

//The possible flags we get
var tileVariationMap = [];
tileVariationMap[11] = [0, 1];
tileVariationMap[15] = [0, 1];
tileVariationMap[22] = [0, 2];
tileVariationMap[23] = [0, 2];
tileVariationMap[31] = [0, 0];
tileVariationMap[43] = [0, 1];
tileVariationMap[63] = [0, 0];
tileVariationMap[104] = [2, 3];
tileVariationMap[105] = [2, 3];
tileVariationMap[107] = [2, 1];
tileVariationMap[111] = [2, 1];
tileVariationMap[126] = [2, 2];
tileVariationMap[127] = [2, 0];
tileVariationMap[150] = [0, 2];
tileVariationMap[159] = [0, 0];
tileVariationMap[208] = [1, 3];
tileVariationMap[212] = [1, 3];
tileVariationMap[214] = [1, 2];
tileVariationMap[215] = [1, 2];
tileVariationMap[219] = [1, 1];
tileVariationMap[223] = [1, 0];
tileVariationMap[235] = [2, 1];
tileVariationMap[246] = [1, 2];
tileVariationMap[248] = [3, 3];
tileVariationMap[249] = [3, 3];
tileVariationMap[251] = [3, 1];
tileVariationMap[252] = [3, 3];
tileVariationMap[254] = [3, 2];

function getVariation(index, row, column, minRow, maxRow, minColumn, maxColumn) {
	
	//Grab the width and height
	var width = mods[logic.currentMod].terrain.width;
	var height = mods[logic.currentMod].terrain.height;
	
	//Grab our arrays for easy modification
	var top = mods[logic.currentMod].terrain.tileMapTop;
	var bottom = mods[logic.currentMod].terrain.tileMapBottom;
	
	var topIndex, bottomIndex, takesTop;
	if (top[index*3+2] <= transformers.texture.index) {
		takesTop = true;
		
		topIndex = transformers.texture.index;
		bottomIndex = top[index*3+2];
		
	} else {
		takesTop = false;
		
		topIndex = top[index*3+2];
		bottomIndex = transformers.texture.index;
	}
	
	//Flag for neighbours, a binary value (eight-bit, for each neighbour)
	var flag = 0;
	
	//Define variables we'll be using in the loop
	var tRow, tCol, tDirection, tIndex, tileRelation;
	
	//Loop through each neighbouring tile to see if it's touching
	for (var i = 0; i < 8; i++) {
		
		//Get our offset row/column
		tRow = row + neighbors[i][0];
		tCol = column + neighbors[i][1];
		
		//And the corner/direction of the neighbour we're checking
		tDirection = neighbors[i][2];
		
		//Any neighbours in the brush area are of the same type as well as those outside the map
		if ((tRow >= minRow && tRow <= maxRow && tCol >= minColumn && tCol <= maxColumn) || tRow < 0 || tRow >= width || tCol < 0 || tCol >= height)
			flag += 1 << i;
		
		//A neighbour outside the brush area
		else {
			
			//Calculate the tile's index
			tIndex = (tRow*width + tCol)*3;
			
			//Returns the col array
			tileRelation = tileRelations[top[tIndex]];
			
			//The row doesn't exist, 
			if (typeof tileRelation == 'undefined') {
				if (top[tIndex+2] == transformers.texture.index)
					flag += 1 << i;
				
			} else {
				
				tileRelation = tileRelation[top[tIndex+1]];
				
				if (tileRelation & tDirection)
					if (top[tIndex+2] == transformers.texture.index)
						flag += 1 << i;
				else
					if (bottom[tIndex+2] == transformers.texture.index)
						flag += 1 << i;
			}
		}
	}
	
	
	var tileVar, randTile;
	
	//Surrounded by similar, use a random full
	if (flag == 255) {
		randTile = Mod.randomTile();
		randTile.unshift(transformers.texture.index);
		
		return randTile;
	
	//A defined surrounding
	} else if (tileVar = tileVariationMap[flag]) {
		
		//Destructure instead of unshift so we don't modify the map
		return [transformers.texture.index, tileVar[0], tileVar[1]];
		
	} else {
		console.log(row, column, flag);
		
		return [4, 0, 3];
	}
}

//Award for most arguments goes to...
function edgeOfBrush(row, column, minRow, maxRow, minRowCenter, maxRowCenter, minColumn, maxColumn, minColumnCenter, maxColumnCenter) {
	
	return	(row == minRow && minRow != minRowCenter) ||
					(row == maxRow && maxRow != maxRowCenter) ||
	
					(column == minColumn && minColumn != minColumnCenter) ||
					(column == maxColumn && maxColumn != maxColumnCenter);
	
}

//And the award for most descriptive function goes to...
function buildColorFromTopTileMap(index) {
	
	//Grab our arrays for easy modification
	var top = mods[logic.currentMod].terrain.tileMapTop;
	
	return '#' + pad(top[index], 2, 16) + pad(top[index+1], 2, 16) +
			pad(top[index+2], 2, 16);
}

function pad(num, length, type) {
	var num = num.toString(type || 10);
	
	return num.length >= length ?
		num :
		new Array(length - num.length + 1).join('0') + num;
}

//from georg@Stack; http://stackoverflow.com/a/9229821
function uniq_fast(a) {
	var seen = {};
	var out = [];
	var len = a.length;
	var j = 0;
	for (var i = 0; i < len; i++) {
		var item = a[i];
		if (seen[item] !== 1) {
			seen[item] = 1;
			out[j++] = item;
		}
	}
	return out;
}
 
//Takes a list of vertices and returns the position indices within the geometry
function getPositions(cornerVertex) {
	
	//For easy access
	var width = mods[logic.currentMod].terrain.width;
	var positions = logic.plane.geometry.attributes.position.array;
	
	//The array to be returned
	var arr = [];
	
	//Build it (four for each vertex)
	for (var i = 0; i < vertices.length; i++)
		arr.push(cornerVertex[i], (cornerVertex[i]+1),
				(cornerVertex[i]+width+1), (cornerVertex[i]+width+2));
	
	//And return
	return uniq_fast(arr);
}

/******************************************************************************
 ******************************************************************************
 *	Events
 ******************************************************************************
 ******************************************************************************/

//Calls when the mouse presses down (world bound);
function onClick(e) {
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	var mouse = new THREE.Vector2(
		((e.clientX - 257) / (box.clientWidth - 257)) * 2 - 1,
		((e.clientY - 33) / box.clientHeight) * -2 + 1
	);
	
	//Grab the vertex
	var intersect = logic.getIntersect(mouse);
	
	//Grab our normalized vertices
	var closestVertex = logic.intersectClosestVertex(intersect);
	var cornerVertex = logic.intersectCornerVertex(intersect);
	
	//Fire the enabled transformers
	for (var i = 0, transformer; transformer = transformersArray[i]; i++)
		if (transformer.enabled)
			transformer.func(closestVertex, cornerVertex);
	
}

//Calls when the mouse presses down (world bound)
function onMouseDown(e) {
	
	if (e.target.id != 'world') return;
	
	for (var i = 0; i < transformersArray.length; i++)
		if (transformersArray[i].enabled)
			transformersArray[i].active = true;
	
};

//Called when the mouse picks up (window bound)
function onMouseUp(e) {
	
	for (var i = 0; i < transformersArray.length; i++)
		if (transformersArray[i].enabled)
			transformersArray[i].active = false;
	
};

//Called when the page loads
function init() {
	
	//For easy access
	var world = document.getElementById('world');
	
	//Set some objects that we have to wait for init for
	box = document.getElementById('box');
	camera = logic.graphic.camera;
	
	//Attach events
	world.addEventListener('click', onClick);
	world.addEventListener('mousedown', onMouseDown);
	window.addEventListener('mouseup', onMouseUp);
}

/******************************************************************************
 ******************************************************************************
 *	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

//User to fire transforms, generally called from an external onMouseMove
//	Only fires those that are enabled and active
logic.fireTransformers = function(intersect, closestVertex, cornerVertex) {
	
	if (typeof closestVertex == 'undefined')
		closestVertex = logic.intersectClosestVertex(intersect);
	
	if (typeof cornerVertex == 'undefined')
		cornerVertex = logic.intersectCornerVertex(intersect);
	
	for (var i = 0, transformer; transformer = transformersArray[i]; i++)
		if (transformer.enabled && transformer.active)
			transformer.func(closestVertex, cornerVertex);
};

//Used to set the size of the brush (must be an integer > 0)
logic.setBrushSize = function(size) {
	if (typeof size === 'number' && (size%1) === 0 && size > 0)
			brush.size = size;
};

//Used to set the size of the brush (must be an integer)
logic.setBrushStrength = function(strength) {
	if (typeof strength === 'number' && (strength%1) === 0)
			brush.strength = strength;
};

//Used to enable/disable transformers
logic.setTransformer = function(which, state) {
	if (typeof transformers[which] === 'object' &&
			typeof transformers[which].enabled === 'boolean' &&
			typeof state === 'boolean')
		transformers[which].enabled = state;
	else
		throw 'ArgumentError: Transformer unknown ' + which;
};

//Used to set the texture index
logic.setTransformerTexture = function(textureIndex) {
	if (typeof textureIndex === 'number' && textureIndex > 0)
		transformers.texture.index = textureIndex;
}

//Used to set the direction on the height transformer
logic.setTransformerHeightDirection = function(direction) {
	if (direction === -1 || direction === 1)
		transformers.height.direction = direction;
}

})(logic);
