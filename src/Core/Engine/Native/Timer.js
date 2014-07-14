Timer = function(timestamp, context, timeout, callback, enabled) {
	this.timestamp = timestamp;
	this.context = {objects: [], parent: context};
	this.timeout = parseFloat(timeout) > 0 ? parseFloat(timeout) : 1;
	this.callback = callback;
	this.enabled = Boolean(enabled);
	
	for (var key in context.objects) {
		var obj = context.objects[key];
		while (obj instanceof DynamicVariable) obj = get(timestamp, obj);
		
		this.context.objects[key] = obj;
	}
	
	//console.log('Timer', context);
	
	var now = Date.now()/1000 - e.timeDifference;
	
	if (enabled == true) {
		while (this.timestamp + timeout < now) {
			console.log('timer1', this.timestamp);
			this.timestamp = this.timestamp + timeout;
			e.runBlock(callback, this.timestamp, context);
		}
		
		setTimeout($.proxy(this.timeoutFunc, this), (this.timestamp + timeout - now)*1000);
	}
	
	new DynamicVariable(this, timestamp);
}

Timer.prototype.timeoutFunc = function(fullPredict) {
	if (this.enabled == true) {
		//if (!fullPredict) console.log(new Date().getTime()/1000, e.ping/1000)
		var now = Date.now()/1000 - e.timeDifference;
		
		while (this.timestamp + this.timeout < now) {
			this.timestamp = this.timestamp + this.timeout;
			e.runBlock(this.callback, this.timestamp, this.context);
		}
		
		setTimeout($.proxy(this.timeoutFunc, this), (this.timestamp + this.timeout - now)*1000);
	}
}