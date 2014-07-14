Callable = function(call) {
	this.type = call[0];
	this.name = call[1];
	this.arguments = [];
	
	if (this.type == 'call') {
		if (typeof call[2] == 'string') {
			this.arguments.push(call[2]);
		} else if (call[2] instanceof Array) {
			call[2].forEach(function(v){
				if (typeof v == 'string') this.arguments.push(v);
				else if (v instanceof Array) {
					t = new Callable(v);
					if (isset(t.name)) this.arguments.push(t);
				}
			}.bind(this));
		}
	}
}

Callable.prototype.run = function(context, timestamp) {
	e.runBlock(this.arguments, timestamp, context, false);
}