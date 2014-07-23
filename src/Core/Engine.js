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
	
	//Protocol is empty, don't try to load anything; just trigger
	if (this.protocol == null) {
		this.$.trigger("onLoad", []);
		return;
	}
	
	this.$.trigger("onLoad", []);
};
