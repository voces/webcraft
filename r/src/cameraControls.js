
/*
	Object _cameraControl
		Key .leftRight
		Key .upDown
	
	Requires
		local.js
		Key.js
*/

_cameraControl = {};
_cameraControl.leftRight = new Key({on: "camera", path: ["position", "x"], enabled: false});
_cameraControl.upDown = new Key({on: "camera", path: ["position", "y"], enabled: false});
_cameraControl.cameraPanEnabled = true;

function disableCameraPan() {
	_cameraControl.cameraPanEnabled = false;
}

function enableCameraPan() {
	_cameraControl.cameraPanEnabled = true;
}

local.on("wheel", function(e) {
	if (!e.altKey) {
		postMessage({
			_func: "adjustCameraField",
			field: "height",
			amount: e.delta * 200
		});
	} else {
		postMessage({
			_func: "adjustCameraField",
			field: "angle",
			amount: e.delta * Math.PI/180
		});
	}
});

local.on("keydown", function(e) {
	if (!e.firstDown || !_cameraControl.cameraPanEnabled) return;
	
	if (e.which == 37) _cameraControl.leftRight.enable({amount: -500});
	else if (e.which == 38) _cameraControl.upDown.enable({amount: 500});
	else if (e.which == 39) _cameraControl.leftRight.enable({amount: 500});
	else if (e.which == 40) _cameraControl.upDown.enable({amount: -500});
});

local.on("keyup", function(e) {
	if (!_cameraControl.cameraPanEnabled) return;
	
	if (e.which == 37) _cameraControl.leftRight.disable();
	else if (e.which == 38) _cameraControl.upDown.disable();
	else if (e.which == 39) _cameraControl.leftRight.disable();
	else if (e.which == 40) _cameraControl.upDown.disable();
});
