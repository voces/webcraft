
Key = function(args) {
	
	if (typeof args == "undefined") args = {};
	
	this.obj = args.obj || null;
	this.property = args.property || null;
	this.how = args.how || "frame";
	
	this.start = args.start || Date.now();
	this.last = this.start;
	
	this.method = args.method || "linear";
	
	//General
	this.max = args.max || Infinity;
	this.min = args.min || -Infinity;
	
	//Linear
	this.amount = args.amount;
	
	//Approach
	this.target = args.target || null;
	this.minRate = args.minRate || 0.1;
	this.rate = args.rate || 0.2;
	
};

Key.prototype.update = function() {
	
	var now = Date.now();
	var delta = (now - this.last)/1000;
	
	this.last = now;
	
	if (this.method == "linear") {
		
		this.obj[this.property] += delta * this.amount;
		
		if (this.obj[this.property] > this.max)
			this.obj[this.property] = this.max;
		
		if (this.obj[this.property] < this.min)
			this.obj[this.property] = this.min;
		
	} else if (this.method == "approach") {
		
		var oldValue = this.obj[this.property];
		var newValue = oldValue * (1 - this.rate) + this.target * this.rate;
		
		if (Math.abs(newValue - oldValue) < this.minRate) {
			
			var sign = this.target >= 0 ? 1 : -1;
			
			if (this.target > 0)
				newValue = Math.min(oldValue + this.minRate, this.target);
			else if (this.target < 0)
				newValue = Math.max(oldValue - this.minRate, this.target);
			else {
				if (oldValue > 0)
					newValue = Math.min(oldValue + this.minRate, this.target);
				else
					newValue = Math.max(oldValue - this.minRate, this.target);
			}
		}
		
		this.obj[this.property] = newValue;
		
		if (this.obj[this.property] > this.max)
			this.obj[this.property] = this.max;
		
		if (this.obj[this.property] < this.min)
			this.obj[this.property] = this.min;
		
		if (newValue == this.target) return true;
		
	}
	
	return false;
	
};

Key.prototype.destroy = function() {
	
};
