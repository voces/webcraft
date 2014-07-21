Engine = function() {
	this.protocol = null;
	
	this.$ = $(this);
};

Engine.prototype.clear = function() {
	this.protocol = null;
};

Engine.prototype.load = function(protocol) {
	
	if (this.protocol != null)
		this.clear();
	
	this.protocol = protocol;
	
	this.$.trigger("onLoad", []);
};
