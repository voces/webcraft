
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
		func: function(closestVertex, cornerVertex) {
			
			//Grab the width
			var width = mods[logic.currentMod].terrain.width;
			
			//How much to change the height
			var modifier = brush.strength * transformers.height.direction;
			
			//Grab our arrays for easy modification
			var positionArray = logic.plane.geometry.attributes.position.array;
			var modPositions = mods[logic.currentMod].terrain.heightMap;
			
			//Modify them
			positionArray[closestVertex*3+2] += modifier;
			modPositions[closestVertex] += modifier;
			
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
		func: function(closestVertex, cornerVertex) {
			
			//Grab the width
			var width = mods[logic.currentMod].terrain.width+1;
			
			//Set our color to green (selection)
			var tileTextureIndex = pad(transformers.texture.index, 2, 16);
			
			//Get the coordinates of the tile
			x = closestVertex % width;
			y = Math.floor(closestVertex / width);
			
			//Draw it
			
			//Top left
			logic.tileMapTopContext.fillStyle = '#0103' + tileTextureIndex;
			logic.tileMapTopContext.fillRect(x-1, y-1, 1, 1);
			
			//Top right
			logic.tileMapTopContext.fillStyle = '#0203' + tileTextureIndex;
			logic.tileMapTopContext.fillRect(x, y-1, 1, 1);
			
			//Bottom left
			logic.tileMapTopContext.fillStyle = '#0002' + tileTextureIndex;
			logic.tileMapTopContext.fillRect(x-1, y, 1, 1);
			
			//Bottom right
			logic.tileMapTopContext.fillStyle = '#0001' + tileTextureIndex;
			logic.tileMapTopContext.fillRect(x, y, 1, 1);
			
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
	type: 'square'
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
