dDebug = false;

DynamicVariable = function(value, timestamp, noPush) {
	this.values = [];
	this.values.push([timestamp, value]);
	
	if (!noPush) e.objects.push(this);
	
	if (dDebug) {
		console.log('DynamicVariable', this, value);
		console.trace();
	}
}

DynamicVariable.prototype.set = function(value, timestamp) {
	this.values.push([timestamp, value]);
}

DynamicVariable.prototype.get = function(timestamp) {
	var low = 0;
	var high = this.values.length - 1;
	
	while (true) {
		if (timestamp < this.values[low][0]) {
			//console.log('.run0');
			return;	//timestamp is before range, return null
		} else if (timestamp >= this.values[high][0]) {
			//console.log('.run1', this.values[high][1]);
			return this.values[high][1];	//timestamp is beyond range, return latest value
		} else {	//timestamp is within range, reduce range
			var mid = parseInt((high+low)/2);
			
			if (this.values[mid][0] < timestamp)
				low = mid;
			else {
				while (isset(this.values[mid+1]) && this.values[mid][0] == this.values[mid+1][0]) mid++;
				high = mid;
			}
			
			if (high-low <= 1) {	//only two values in range, must be one
				if (this.values[high][0] > timestamp) {	//if high value is before timestamp, return low
					//console.log('.run2');
					return this.values[low][1];
				} else if (this.values[high][0] == timestamp) {	//if high value is at timestamp, obviously return high
					//console.log('.run3');
					return this.values[high][1];
				}
			}
		}
	}
}

set = function(parent, ref, val, timestamp) {
	val = get(timestamp, val);
	ref = get(timestamp, ref);
	
	if (isset(parent.objects[ref])) {
		if (parent.objects[ref] instanceof DynamicVariable) {
			parent.objects[ref].set(val, timestamp);
		} else {
			if (parent != e) parent.objects[ref] = new DynamicVariable(parent.objects[ref], timestamp).set(val, timestamp);
			else parent.objects[ref] = new DynamicVariable(parent.objects[ref], timestamp).set(val, timestamp, true);
		}
	} else {
		if (parent != e) parent.objects[ref] = new DynamicVariable(val, timestamp);
		else parent.objects[ref] = new DynamicVariable(val, timestamp, true);
	}
	
	return parent.objects[ref];
}

set2 = function(ref, val, timestamp) {
	val = get(timestamp, val);
	var r;
	
	if (isset(ref)) {
		if (typeof ref == 'object' && ref instanceof DynamicVariable) {
			r = ref;
			r.set(val, timestamp);
		} else {
			r = new DynamicVariable(ref, timestamp);
			r.set(val, timestamp);
		}
	} else {
		r = new DynamicVariable(val, timestamp);
	}
	
	return r;
}

get = function(timestamp, dvar) {
	if (typeof dvar == 'object' && dvar instanceof DynamicVariable) {
		//console.log('get0');
		return dvar.get(timestamp);
	} else {
		//console.log('get1');
		return dvar;
	}
}

finalize = function(timestamp, context, dvar) {
	dvar = e.getReference(timestamp, context, dvar);
	while (dvar instanceof DynamicVariable) dvar = get(timestamp, dvar);
	
	return dvar;
}