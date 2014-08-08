
/*
	Requires
		applyProperties.js
		Point.js
	
	Provides
		Widget(Object props, Boolean localize)
		Array widgets
*/

function Polygon(props) {
	
	this.vertices = [];
	this.segments = [];
	
	applyProperties(this, props);
	
	if (this.vertices.length > 0) {
		for (var i = 1; i < this.vertices.length; i++)
			this.segments.push(new Segment(this.vertices[i-1], this.vertices[i]));
		
		this.segments.push(new Segment(this.vertices[this.vertices.length-1], this.vertices[0]));
	}
	
	Polygon.list.push(this);
	
}

Polygon.list = [];

Polygon.prototype.intercepts = function(segment) {
	
	//Polygon is empty, return false
	if (this.segments.length == 0) return false;
	
	//Define intercept variables
	var intercepts = [],
		intercept;
	
	//Check our segments
	for (var i = 0; i < this.segments.length; i++) {
		if (intercept = segment.intercept(this.segments[i]))
			intercepts.push(intercept);
	}
	
	//No intercepts, return false
	if (intercepts.length == 0) return false;
	else return intercepts;
	
};

Polygon.prototype.intercept = function(segment) {
	
	var intercepts = this.intercepts(segment);
	
	//No intercepts, return false
	if (!intercepts) return false;
	
	//Grab our default intercept (first)
	var firstIntercept = intercepts[0];
	firstIntercept.uDistance = firstIntercept.distance(segment.u);
	
	//Now compare against all other intercepts until we find our shortest one
	for (var i = 1; i < intercepts.length; i++) {
		intercepts[i].uDistance = intercepts[i].distance(segment.u);
		if (intercepts[i].uDistance < firstIntercept.uDistance)
			firstIntercept = intercepts[i];
	}
	
	return firstIntercept;
	
};

Polygon.prototype.timeTillIntercept = function(segment, speed) {
	var intercept = this.intercept(segment);
	
	return intercept.uDistance / speed * 1000;
};
