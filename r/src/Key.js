
/*
	Key
	
	Requires
		applyProperties.js
		local.js
*/

function Key(args) {
	
	this.id = NaN								//Actual ID, assigned by engine
	this.tempID = Date.now() + Math.random();	//ID used only for creation
	
	this.on = args.on;
	this.path = args.path;
	this.how = args.how || "frame";
	this.growth = args.growth || "linear";
	this.start = args.timestamp || Date.now();
	this.amount = args.amount;
	
	if (typeof args.enabled == "undefined") this.enabled = true;
	else this.enabled = args.enabled;
	
	Key.list.push(this);
	
	postMessage({
		_func: "createKey",
		tempID: this.tempID,
		on: this.on,
		path: this.path,
		how: this.how,
		growth: this.growth,
		start: this.start,
		amount: this.amount,
		enabled: this.enabled
	});
}

Key.list = [];
Key.firstUnused = 0;	//So we don't loop through all the keys everytime we get a new one...

Key.prototype.enable = function(properties) {
	applyProperties(this, properties);
	
	var obj = {};
	
	applyProperties(obj, properties);
	
	obj._func = "enableKey";
	obj.id = this.id;
	
	postMessage(obj);
}

Key.prototype.disable = function() {
	postMessage({
		_func: "disableKey",
		id: this.id
	});
}

local.on("createKey", function(e) {
	
	var flag = true;
	for (var i = Key.firstUnused; i < Key.list.length; i++) {
		if (isNaN(Key.list[i].id) && flag) {
			Key.firstUnused = i;
			flag = false;
		}
		
		if (Key.list[i].tempID == e.tempID) {
			Key.list[i].id = e.oid;
			break;
		}
	}
	
});
