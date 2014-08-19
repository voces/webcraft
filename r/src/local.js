
/*
	Requires
		EventTarget.js
	
	Provides
		EventTarget local
*/

var local = new EventTarget();
local.keys = [];

local.on("keydown", function(e) {
	if (local.keys[e.which] != true) {
		e.firstDown = true;
		local.keys[e.which] = true;
	} else e.firstDown = false;
});

local.on("keyup", function(e) {
	local.keys[e.which] = false;
});
