
(function(blah) {

var apples = 12;

})(logic);

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
	
	/****************************************************************************
	 ****************************************************************************
	 *	Texture
	 ****************************************************************************
	 ****************************************************************************/
	
	//Modifies the texture assigned to tiles
	texture: {
		enabled: false,
		active: false,
		index: 1,
		func: function(closestVertex) {
			
			/*console.log(new Array(16).join("*"));
			console.log(new Array(5).join("*") + "Texture" + new Array(5).join("*"));
			console.log(new Array(16).join("*"));*/
			
			/************************************************************************
			 *	Grab everything we need
			 ************************************************************************/
			
			//Grab the width and height
			var width = mods[logic.currentMod].terrain.width;
			var height = mods[logic.currentMod].terrain.height;
			var wWidth = width+1;
			
			//Grab our brush size
			var size = brush.size;
			
			//Set our new tile
			var tileTextureIndex = transformers.texture.index;
			
			//Grab our arrays for easy modification
			var tileMaps = mods[logic.currentMod].terrain.tileMaps;
			var contexts = logic.contexts;
			
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
			var centerExists = minColumnCenter <= maxColumnCenter && minRowCenter <= maxRowCenter;
			
			//Variables we'll need in the loop
			var index, variation, randTile;
			
			/************************************************************************
			 *	Loop through the tiles being updated
			 ************************************************************************/
			
			//console.log(minColumn, maxColumn, minRow, maxRow);
			
			//Loop through the entire brush area (we're limited to inbounds)
			for (var col = minColumn; col <= maxColumn; col++)
				for (var row = minRow; row <= maxRow; row++) {
					
					//console.log(col, row);
					
					//Grab the index
					index = (row*width + col)*3;
					
					//console.log('**', index/3, new Array(25).join('*'));
					
					/********************************************************************
					 *	Edge
					 ********************************************************************/
					
					//A center doesn't exist or we're outside of it
					if (!centerExists || edgeOfBrush(row, col, minRow, maxRow, minRowCenter, maxRowCenter, minColumn, maxColumn, minColumnCenter, maxColumnCenter)) {
						
						//Get the variation; the rect defined by min/max row/column is
						//		treated as the the passed tile
						variation = getVariation(index, row, col, minRow, maxRow, minColumn, maxColumn);
						
						//Extra info from variation
						var newLayerIndex = variation[0],
								existingLayer = variation[1],
								newLayer = {
									y: variation[2],
									x: variation[3],
									tile: transformers.texture.index,
									coverage: tileCoverage[variation[2]][variation[3]]
								};
						
						var layer;
						
						//Merged coverages
						//	workingCoverage is first of layer[3], then [2], etc.
						//	newWorkingcoverage is as above, except inits at newLayerCoverage
						var workingCoverage = 0,
								
						//Holds the coverage for the active layer (when looping)
								modifiedLayerCoverage,
								
						//For when we are pushing layers down
								aboveLayer = null, tAboveLayer,
								aboveLayerCoverage;
						
						//Loop through the layers
						layerLoop: for (var i = 3; i >= 0; i--) {
							
							//Grab the details of the active layer
							layer = {
								y: tileMaps[i][index],
								x: tileMaps[i][index+1],
								tile: tileMaps[i][index+2],
								coverage: tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]
							};
							
							//Make sure this layer updates
							logic.textures[i].needsUpdate = true;
							
							/****************************************************************
							 *	Updating above
							******************************************************************/
							
							//Above our layer insert
							if (i > newLayerIndex) {
								
								//Calculate how much the layer should be covering (the layer minus coverage, which is the new layer + any layers above even this one)
								layer.modifiedCoverage = layer.coverage & ~workingCoverage & ~newLayer.coverage;
								workingCoverage |= layer.coverage;
								
								//Layer has been killed, so pull EVERYTHING up
								if (layer.modifiedCoverage == 0) {
									
									//Loop down, don't include 0 because nothing is below it
									for (var n = i; n > 0; n--) {
										
										//Grab the details of the layer below
										if (n == newLayerIndex) {
											layer = newLayer;
											layer.coverage |= workingCoverage;
										} else
											layer = {
												y: tileMaps[n-1][index],
												x: tileMaps[n-1][index+1],
												tile: tileMaps[n-1][index+2],
												coverage: (tileCoverage[tileMaps[n-1][index]][tileMaps[n-1][index+1]] | workingCoverage) & ~newLayer.coverage
											};
										
										//Update the variation to include the above coverage
										if (layer.coverage == 15) {
											randTile = Mod.randomTile();
											
											layer.y = randTile[0];
											layer.x = randTile[1];
										
										//This layer is dead...
										} else if (layer.coverage == 0) {
											
											layer = newLayer;
											layer.coverage |= workingCoverage;
											
										} else {
											layer.y = tileVariationMap[layer.coverage][0];
											layer.x = tileVariationMap[layer.coverage][1];
										}
										
										//Paint it
										//console.log('player', n, newLayerIndex, index/3, layer);
										paintTile(tileMaps[n], contexts[n], index, col, row, layer.y, layer.x, layer.tile);
										
										if (layer.coverage == 15) {
											//console.log('break a');
											break layerLoop;
										}
										
									}
									
								//The layer survives
								} else {
									
									//Grab the variation
									layer.y = tileVariationMap[layer.modifiedCoverage][0];
									layer.x = tileVariationMap[layer.modifiedCoverage][1];
									
									//And update
									//console.log('ulayer', i, 'index', index/3, 'r', layer.y, 'g', layer.x, 'b', layer.tile);
									paintTile(tileMaps[i], contexts[i], index, col, row, layer.y, layer.x, layer.tile);
									
								}
							
							/****************************************************************
							 *	Updating current
							*****************************************************************/
							
							//We're on the target tile layer
							} else if (i == newLayerIndex) {
								
								//Bottom layer, just make it full
								if (i == 0 && newLayer.coverage != 15) {
									randTile = Mod.randomTile();
									
									newLayer.y = randTile[0];
									newLayer.x = randTile[1];
									newLayer.coverage = 15;	//REMOVE
									
								}
								
								workingCoverage |= newLayer.coverage
								
								//If the workingCoverage doesn't match the layer coverage, expand it
								if (newLayer.coverage != workingCoverage) {
									
									//Full, generate random
									if (workingCoverage == 15) {
										randTile = Mod.randomTile();
										
										newLayer.y = randTile[0];
										newLayer.x = randTile[1];
										newLayer.coverage = 15;	//REMOVE
										
									//Not full, grab from table
									} else {
										
										newLayer.y = tileVariationMap[workingCoverage][0];
										newLayer.x = tileVariationMap[workingCoverage][1];
										newLayer.coverage = workingCoverage;	//REMOVE
										
									}
								}
								
								//Preserve the current layer
								aboveLayer = {
									y: tileMaps[i][index],
									x: tileMaps[i][index+1],
									tile: tileMaps[i][index+2],
									coverage: tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]
								};
								
								//Paint on it
								//console.log('tlayer', i, index/3, newLayer);
								paintTile(tileMaps[i], contexts[i], index, col, row, newLayer.y, newLayer.x, newLayer.tile);
								
								if (existingLayer) {
									//console.log('break c');
									break;
								}
								
							/****************************************************************
							 *	Updating below
							*****************************************************************/
							
							//Below our tile
							} else if (i < newLayerIndex) {
								
								//Preserve the layer
								tAboveLayer = {
									y: tileMaps[i][index],
									x: tileMaps[i][index+1],
									tile: tileMaps[i][index+2],
									coverage: tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]
								};
								
								//Calculate if the above layer is replacing this and add the new coverage to the working coverage
								newCoverage = aboveLayer.coverage & ~workingCoverage;
								workingCoverage |= aboveLayer.coverage;
								
								//Still some coverage left, so we push it down
								if (newCoverage != 0) {
									
									//Bottom layer, just make it full
									if (i == 0) {
										randTile = Mod.randomTile();
										
										aboveLayer.y = randTile[0];
										aboveLayer.x = randTile[1];
									
									//If the workingCoverage doesn't match the layer coverage, expand it
									} else if (aboveLayer.coverage != workingCoverage) {
										
										//Full, generate random
										if (workingCoverage == 15) {
											randTile = Mod.randomTile();
											
											aboveLayer.y = randTile[0];
											aboveLayer.x = randTile[1];
										
										//Not full, grab from table
										} else {
											
											aboveLayer.y = tileVariationMap[workingCoverage][0];
											aboveLayer.x = tileVariationMap[workingCoverage][1];
											
										}
									}
									
									//Replace 
									//console.log('blayer', i, index/3, aboveLayer);
									paintTile(tileMaps[i], contexts[i], index, col, row, aboveLayer.y, aboveLayer.x, aboveLayer.tile);
									
									aboveLayer = tAboveLayer;
									
								//Everything is covered; elevate the last layer to being full
								} else {
									
									//console.log('last', paintTileLast[5], paintTileLast[6], paintTileLast[7], tileCoverage[paintTileLast[5]][paintTileLast[6]]);
									
									/*if (tileCoverage[paintTileLast[5]][paintTileLast[6]] != 15 || paintTileLast[5] > 3) {
									
										randTile = Mod.randomTile();
										
										console.log('flayer', 'index', paintTileLast[2], 'r', randTile[0], 'g', randTile[1], 'b', paintTileLast[7]);
										paintTile(paintTileLast[0], paintTileLast[1], paintTileLast[2], paintTileLast[3], paintTileLast[4], randTile[0], randTile[1], paintTileLast[7]);
									}*/
									
									//console.log('break b');
									break;
									
								}
								
							}
						}
					
					/********************************************************************
					 *	Center
					 ********************************************************************/
					
					//Center exists and we're in it
					} else {
						
						//Grab a random tile
						randTile = Mod.randomTile();
						
						//console.log('layer', 3, 'index', index, 'r', randTile[0], 'g', randTile[1], 'b', transformers.texture.index);
						paintTile(tileMaps[3], contexts[3], index, col, row, randTile[0], randTile[1], transformers.texture.index);
						
						logic.textures[3].needsUpdate = true;
						
					}
					
				}
			
			//Recalc & update
			/*for (var i = 0; i < 4; i++)
				logic.textures[i].needsUpdate = true;*/
			
			//logic.tileMapBottomTexture.needsUpdate = true;
			
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

var paintTileLast;
function paintTile(uint, context, index, column, row, r, g, b) {
	
	uint.set([r, g, b], index);
	/*uint[index] = color[0];
	uint[index+1] = color[1];
	uint[index+2] = color[2];*/
	
	//context.fillStyle = '#' + pad(color[0], 2, 16) + pad(color[1], 2, 16) + pad(color[2], 2, 16);
	context.fillStyle = '#' + pad(r, 2, 16) + pad(g, 2, 16) + pad(b, 2, 16);
	context.fillRect(column, row, 1, 1);
	
	paintTileLast = [uint, context, index, column, row, r, g, b];
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
var tileCoverage = [
	[TOP, TOP_LEFT, TOP_RIGHT, ALL],
	[TOP | BOTTOM_RIGHT, TOP_LEFT | BOTTOM_RIGHT, RIGHT, BOTTOM_RIGHT],
	[TOP | BOTTOM_LEFT, LEFT, TOP_RIGHT | BOTTOM_LEFT, BOTTOM_LEFT],
	[ALL, BOTTOM | TOP_LEFT, BOTTOM | TOP_RIGHT, BOTTOM],
	[ALL, ALL, ALL, ALL],
	[ALL, ALL, ALL, ALL],
	[ALL, ALL, ALL, ALL],
	[ALL, ALL, ALL, ALL]
];

//The possible flags we get
var tileVariationMap = [
	  null, [0, 1], [0, 2], [0, 0],
	[2, 3], [2, 1], [2, 2], [2, 0],
	[1, 3], [1, 1], [1, 2], [1, 0],
	[3, 3], [3, 1], [3, 2]
];

function getCornerIndices(index) {
	
	//Grab our arrays for easy access
	var tileMaps = mods[logic.currentMod].terrain.tileMaps;
	
	var cornerIndices = [], count = 0;
	//console.log('setting');
	for (var i = 3; i >= 0 && count != 4; i--) {
		
		//Top left
		//console.log(i, cornerIndices[0] == null, tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]);
		if (cornerIndices[0] == null && (tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & TOP_LEFT) === TOP_LEFT) {
			cornerIndices[0] = [i, tileMaps[i][index+2]];
			count++;
		}
		
		//Top right
		//console.log(i, cornerIndices[1] == null, tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]);
		if (cornerIndices[1] == null && (tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & TOP_RIGHT) === TOP_RIGHT) {
			//console.log('tr success');
			cornerIndices[1] = [i, tileMaps[i][index+2]];
			count++;
		}
		
		//Bottom left
		//console.log(i, cornerIndices[2] == null, tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]);
		if (cornerIndices[2] == null && (tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & BOTTOM_LEFT) === BOTTOM_LEFT) {
			cornerIndices[2] = [i, tileMaps[i][index+2]];
			count++;
		}
		
		//Bottom right
		//console.log(i, cornerIndices[3] == null, tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]]);
		if (cornerIndices[3] == null && (tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & BOTTOM_RIGHT) === BOTTOM_RIGHT) {
			//console.log('win', i, cornerIndices[3] == null, (tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & BOTTOM_RIGHT) === BOTTOM_RIGHT);
			cornerIndices[3] = [i, tileMaps[i][index+2]];
			count++;
		}//console.log('round', count);
	}
	//console.log('set', cornerIndices);
	return cornerIndices;
	
}

function getVariation(index, row, col, minRow, maxRow, minCol, maxCol) {
	
	/****************************************************************************
	 *	Setup
	 ****************************************************************************/
	
	//Grab the width and height
	var width = mods[logic.currentMod].terrain.width;
	var height = mods[logic.currentMod].terrain.height;
	
	//Grab our arrays for easy modification
	var tileMaps = mods[logic.currentMod].terrain.tileMaps;
	
	var tile = transformers.texture.index;
	
	/****************************************************************************
	 *	Get flag & order
	 ****************************************************************************/
	
	//Flag for neighbours, a binary value (eight-bit, for each neighbour)
	var flag = 0;
	
	//Get the corner tile indices
	var cornerIndices = getCornerIndices(index);
	
	//Figure out which layer we're putting this on...
	var layer = 3, existingLayer = false;
	for (var i = 0; i < 4; i++)
		if (tile == cornerIndices[i][1]) {
			//console.log('layer_', layer, i);
			layer = cornerIndices[i][0];
			existingLayer = true;
			break;
		} else if (tile <= cornerIndices[i][1] && layer >= cornerIndices[i][0]) {
			//console.log('layer__', layer, cornerIndices[i][0]-1);
			layer = cornerIndices[i][0];
		}
	
	//console.log(row, col, width, height);
	
	//Set the flag to represent the new corners
	/*if (row == 0 && col == 0) flag = TOP_LEFT;
	else if (row == 0 && col == width-1) flag = TOP_RIGHT;
	else if (row == height-1 && col == 0) flag = BOTTOM_LEFT;
	else if (row == height-1 && col == width-1) flag = BOTTOM_RIGHT;
	
	else if (row == 0 && col == minCol) flag = TOP_RIGHT;
	else if (row == 0 && col == maxCol) flag = TOP_LEFT;
	else if (row == height-1 && col == minCol) flag = BOTTOM_RIGHT;
	else if (row == height-1 && col == maxCol) flag = BOTTOM_LEFT;
	
	else if (col == 0 && row == minRow) flag = BOTTOM_LEFT;
	else if (col == 0 && row == maxRow) flag = TOP_LEFT;
	
	else if (col == width-1 && row == minRow) flag = BOTTOM_LEFT;
	else if (col == width-1 && row == maxRow) flag = BOTTOM_RIGHT;
	
	else */if (row == minRow && col == minCol) flag = BOTTOM_RIGHT;
	else if (row == minRow && col == maxCol) flag = BOTTOM_LEFT;
	else if (row == maxRow && col == minCol) flag = TOP_RIGHT;
	else if (row == maxRow && col == maxCol) flag = TOP_LEFT;
	else if (row == minRow) flag = BOTTOM;
	else if (row == maxRow) flag = TOP;
	else if (col == minCol) flag = RIGHT;
	else if (col == maxCol) flag = LEFT;
	
	//Combine the flag with the tiles that already exist
	for (var i = 0; i < 4; i++)
		if (cornerIndices[i][1] == tile)
			flag |= 1 << i;
	
	//Ascend the layer if the one above is to be entirely covered
	/*for (var i = layer+1; i < 4; i++)
		if ((tileCoverage[tileMaps[i][index]][tileMaps[i][index+1]] & ~flag) === 0)
			layer++;
		else
			break;*/
	
	/****************************************************************************
	 *	Get the variation and return
	 ****************************************************************************/
	
	var tileVar, randTile;
	
	//Surrounded by similar, use a random full
	if (flag == 15) {
		randTile = Mod.randomTile();
		return [layer, existingLayer, randTile[0], randTile[1]];
	
	//A defined surrounding
	} else if (tileVar = tileVariationMap[flag]) {
		
		//Destructure instead of unshift so we don't modify the mappings
		return [layer, existingLayer, tileVar[0], tileVar[1], transformers.texture.index];
		
	//An undefined surrounding (0... shouldn't happen here)
	} else {
		console.log(row, col, flag, cornerIndices);
		
		randTile = Mod.randomTile();
		return [layer, existingLayer, randTile[0], randTile[1]];
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
	var tileMaps = mods[logic.currentMod].terrain.tileMaps;
	
	return '#' + pad(tileMaps[3][index], 2, 16) + pad(tileMaps[3][index+1], 2, 16) + pad(tileMaps[3][index+2], 2, 16);
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
	
	//Don't bother if a mod isn't loaded
	if (logic.currentMod == -1) return;
	
	//Set saved status
	if (mods[logic.currentMod].saved)
			mods[logic.currentMod].saved = false;
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	var mouse = new THREE.Vector2(
		((e.clientX - 257) / (box.clientWidth - 257)) * 2 - 1,
		((e.clientY - 33) / box.clientHeight) * -2 + 1
	);
	
	//Grab the vertex
	var intersect = logic.getIntersect(mouse);
	
	//Quit if no intersection
	if (!intersect) return;
	
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
