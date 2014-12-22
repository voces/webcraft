
Engine.Key = function(obj, args) {
	
	this.obj = obj;
	this.value = args.path[args.path.length - 1];
	
	if (typeof this.obj[this.value] != "number") throw "Keys are only allowed on numbers.";
	
	this.how = args.how || "frame";
	this.growth = args.growth || "linear";
	this.start = args.start || Date.now();
	this.last = this.start;
	this.amount = args.amount;
};

Engine.Key.prototype.update = function() {
	
	var now = Date.now();
	var delta = (now - this.last)/1000;
	
	if (this.growth == "linear") this.obj[this.value] += delta * this.amount;
	
	this.last = now;
};

Engine.Key.prototype.destroy = function() {
	
};
