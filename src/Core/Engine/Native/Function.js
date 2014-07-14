Function = function(timestamp, parent, arguments, block) {
	this.parent = parent;
	this.objects = [];
	this.arguments = [];
	this.block = block;	//should technically be turned into callables, but I haven't done this on client or host yet
							//For efficentcy, of course
	
	arguments.forEach(function(v) {
		this.objects[v] = new DynamicVariable(null, timestamp);
		this.arguments.push(v);
	}.bind(this));
}

//(ref, context, timestamp)

Function.prototype.run = function(timestamp, context, arguments) {
	if (typeof arguments[0] == 'string') {
		set(this, this.arguments[0], e.getReference(arguments, context, timestamp), timestamp);
	} else {
		arguments.forEach(function(v, i) {
			//console.log('run-a', v, i);
			set(this, this.arguments[i], e.getReference(v, context, timestamp), timestamp);
		}.bind(this));
	}
	
	//console.log('run', this.objects, this);
	e.runBlock(this.block, timestamp, this, false);
}