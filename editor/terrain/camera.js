
(function(logic) {

/******************************************************************************
 ******************************************************************************
 **	Graphics/Camera
 ******************************************************************************
 ******************************************************************************/

var keyboard = [];

var keys;

var currentCamera = 'world',
		previewCamera,
		worldCamera;

//Default linear methods (we scroll the camera until key up)
var panLRKey = new Key({property: 'x'}),
		panUDKey = new Key({property: 'y'}),
		
		//Approaches, handle detaching themselves
		angleKey = new Key({
			property: 'x',
			method: 'approach',
			minRate: .01,
			rate: 0.01,
			target: Math.PI * 17/90
		}),
		zoomKey = new Key({
			property: 'z',
			method: 'approach',
			minRate: 1,
			target: 1792
		});


function onKeyDown(e) {
	
	//No repeats
	if (keyboard[e.which]) return;
	else keyboard[e.which] = true;
	
	var zoom = worldCamera.position.z / 1792;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		if (e.which == 37) panLRKey.amount = -4096 * zoom;
		else panLRKey.amount = 4096 * zoom;
		
		panLRKey.start = Date.now();
		panLRKey.last = panLRKey.start;
		
		keys.push(panLRKey);
		
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		if (e.which == 38) panUDKey.amount = 4096 * zoom;
		else panUDKey.amount = -4096 * zoom;
		
		panUDKey.start = Date.now();
		panUDKey.last = panUDKey.start;
		
		keys.push(panUDKey);
	}
	
}

function onKeyUp(e) {
	
	//No repeats
	keyboard[e.which] = false;
	
	//Left or right
	if (e.which == 37 || e.which == 39) {
		
		panLRKey.update();
		removeA(keys, panLRKey);
	
	//Up or down
	} else if (e.which == 38 || e.which == 40) {
		
		panUDKey.update();
		removeA(keys, panUDKey);
	}
	
	//Block alt from bubbling to browser UI
	if (e.which == 18) e.preventDefault();
	
}

function onScroll(e) {
	
	//Scroll = zoom
	if (!e.altKey) {
		
		if (e.deltaY < 0)
			zoomKey.target -= 32;
		else
			zoomKey.target += 32;
		
		if (keys.indexOf(zoomKey) < 0)
			keys.push(zoomKey);
		
	
	//ALT+Scroll = rotate along x (angle to ground)
	} else {
		
		if (e.deltaY < 0)
			angleKey.target = angleKey.target + Math.PI / 64;
		else
			angleKey.target = angleKey.target - Math.PI / 64;
		
		if (keys.indexOf(angleKey) < 0)
			keys.push(angleKey);
	
	}
}

function init() {
	
	previewCamera = logic.graphic.previewCamera;
	worldCamera = logic.graphic.camera;
	
	keys = logic.graphic.keys;
	
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
	document.getElementById('world').addEventListener('wheel', onScroll);
	
	//Related keys
	panLRKey.obj = worldCamera.position;
	panUDKey.obj = worldCamera.position;
	angleKey.obj = worldCamera.rotation;
	zoomKey.obj = worldCamera.position;
	
}

/******************************************************************************
 ******************************************************************************
 **	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

logic.camera = {};

Object.defineProperties(logic.camera, {
	
	'current': {
		get: function() {return currentCamera},
		set: function(newCamera) {
			
			if (newCamera == 'world') {
				currentCamera = 'world';
				
				panLRKey.obj = worldCamera.position;
				panUDKey.obj = worldCamera.position;
				angleKey.obj = worldCamera.rotation;
				zoomKey.obj = worldCamera.position;
			} else if (newCamera == 'preview') {
				currentCamera = 'preview';
				
				panLRKey.obj = previewCamera.position;
				panUDKey.obj = previewCamera.position;
				angleKey.obj = previewCamera.rotation;
				zoomKey.obj = previewCamera.position;
			}
		},
		enumerable: true,
		configurable: true
	},
	
	'dimensions': {
		set: function(dimensions) {
			panUDKey.min = dimensions.height*-64 - 1024;
			panUDKey.max = dimensions.height*64 - 512;// - 1024;
			panLRKey.min = dimensions.width*-64;
			panLRKey.max = dimensions.width*64;
		}
	}
});

})(logic);
