Library = function(parent, block) {
	this.parent = parent;
	this.objects = [];
	this.block = block;
}

Library.prototype.init = function(timestamp) {
	e.runBlock(this.block, timestamp, this, true);
}