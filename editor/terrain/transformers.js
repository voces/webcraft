
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
		func: function(cornerVertex) {
			
			//Grab all our stuff (positions to be modified, how much, and one for
			//		easy access)
			var tiles = getTiles(cornerVertex);
			var positions = getPositions(tiles);
			var modifier = brush.strength * transformers.height.direction;
			var positionArray = logic.plane.geometry.attributes.position.array;
			
			//Modify them
			for (var i = 0, position; position = positions[i]; i++)
				positionArray[position] += modifier;
			
			//Make sure geometry is updated
			logic.plane.geometry.computeVertexNormals();
			logic.plane.geometry.attributes.position.needsUpdate = true;
			
		}
	},
	
	//Modifies the texture assigned to tiles
	texture: {
		enabled: false,
		active: false,
		index: 1,
		func: function(cornerVertex) {
			
			//Grab our tiles to change
			var tiles = getTiles(cornerVertex);
			//var pixelRGB = (0x000300 + transformers.texture.index).toString(16);
			
			//Grab the width and height
			var width = mods[logic.currentMod].terrain.width;
			var height = mods[logic.currentMod].terrain.height;
			
			//Set our color to green (selection)
			logic.tileMapTopContext.fillStyle = '#0003' +
					pad(transformers.texture.index, 2, 16);
			
			//Convert raw tile into one for the tileMap
			for (var i = 0, tile, x, y; (tile = tiles[i]) != null; i++) {
				console.log(tile);
				tile = tile - Math.floor(tile / (width+1));
				console.log(tile);
				//Get the coordinates of the tile
				x = tile % width;
				y = Math.floor(tile / width);
				
				//Draw it
				logic.tileMapTopContext.fillRect(x, y, 1, 1);
				
			}
			
			//Recalc & update
			logic.tileMapTopTexture.needsUpdate = true;
			
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
	type: 'circle'
};

//Objects from outside (DOM or otherwise)
var box;
var camera;
var uiPoint;

/******************************************************************************
 ******************************************************************************
 *	Support
 ******************************************************************************
 ******************************************************************************/

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
function getPositions(vertices) {
	
	//For easy access
	var width = mods[logic.currentMod].terrain.width;
	var positions = logic.plane.geometry.attributes.position.array;
	
	//The array to be returned
	var arr = [];
	
	//Build it (four for each vertex)
	for (var i = 0; i < vertices.length; i++)
		arr.push(vertices[i]*3+2, (vertices[i]+1)*3+2,
				(vertices[i]+width+1)*3+2, (vertices[i]+width+2)*3+2);
	
	//And return
	return uniq_fast(arr);
}

//Eventually this will take a primary vertex and return a list of vertices
//	At the moment it returns the primary (a 1x1 square)
function getTiles(cornerVertex) {
	
	var arr = [cornerVertex];
	
	return arr;
	
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
	var vertex = logic.getIntersect(mouse);
	
	for (var i = 0; i < transformersArray.length; i++)
		if (transformersArray[i].enabled)
			transformersArray[i].func(vertex);
	
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
	uiPoint = logic.point;
	
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
logic.fireTransformers = function(vertex) {
	for (var i = 0, transformer; transformer = transformersArray[i]; i++)
		if (transformer.enabled && transformer.active)
			transformer.func(vertex);
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

