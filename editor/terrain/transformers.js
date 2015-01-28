
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
		func: function(vertex) {
			
			//Grab all our stuff (positions to be modified, how much, and one for
			//		easy access)
			var positions = getPositions(vertex);
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
	
	
	texture: {
		enabled: false,
		active: false,
		index: 0,
		func: function(vertex) {
				
				
				
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

//Takes a corner vertex and gives all the positions that should be modified
//	At the moment it returns a 1x1 square...
function getPositions(vertex) {
	
	//For easy access
	var width = mods[logic.currentMod].terrain.width;
	var positions = logic.plane.geometry.attributes.position.array;
	
	//The array to be returned
	var arr = [];
	
	//Build it (the 1x1 ATM)
	arr.push(vertex*3+2, (vertex+1)*3+2,
			(vertex+width+1)*3+2, (vertex+width+2)*3+2);
	
	//And return
	return arr;
}

//Eventually this will take a primary vertex and return a list of vertices
function getVertices(primary) {
	
	var arr = [primary];
	
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
};

//Used to set the direction on the height transformer
logic.setTransformerHeightDirection = function(direction) {
	if (direction === -1 || direction === 1)
		transformers.height.direction = direction;
}

})(logic);

