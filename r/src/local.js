
/*
	Requires
		EventTarget.js
	
	Provides
		EventTarget local
		Array localKeys
*/

var local = new EventTarget();
var localKeys = [];

local.on("keydown", function(e) {
	if (localKeys[e.which] != true) {
		e.firstDown = true;
		localKeys[e.which] = true;
	}
});

local.on("keyup", function(e) {
	localKeys[e.which] = false;
});
