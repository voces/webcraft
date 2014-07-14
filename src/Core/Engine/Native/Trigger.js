Trigger = function(timestamp, context, event, networkconditions, conditions, callbacks) {
	
	//console.log('Trigger', {timestamp:timestamp, context:context, event:event, networkconditions:networkconditions, conditions:conditions, callbacks:callbacks});
	
	this.context = context;
	this.enabled = true;
	
	if (typeof event == "string") {
		if (event.length > 1) event = constants[event];
		
		this.event = event;
	}
	
	this.conditions = conditions;
	this.networkconditions = networkconditions;
	this.callbacks = callbacks;
	
	/*if (conditions instanceof Array) {
		if (typeof conditions[0] == 'string') {
			t = new Callable(conditions);
			if (isset(t.name)) this.conditions.push(t);
		}
	}
	
	if (callbacks instanceof Array) {
		if (typeof callbacks[0] == 'string') {
			t = new Callable(callbacks);
			if (isset(t.name)) this.callbacks.push(t);
		}
	}*/
	
	new DynamicVariable(this, timestamp);
}

Trigger.prototype.preCheck = function(timestamp) {
	var test = e.getReference(this.networkconditions, this.context, timestamp);
	
	while (test instanceof DynamicVariable) test = get(timestamp, test);
	
	if (test == true) return true;
	else return false;
}