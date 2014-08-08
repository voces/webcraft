
/*
	Requires
		Point.js
	
	Segment(Point u, Point v)
		.u	returns Point
		.v	returns Point
		
		.clone()	returns Segment
		
		.difference()	returns new Point
		.intercept(Segment)	returns new Point
		
		.length()	returns number
*/

Segment = function(u, v) {
	this.u = u;
	this.v = v;
}

Segment.prototype.clone = function() {
	return new Segment(this.u, this.v);
};

Segment.prototype.difference = function() {
	return this.v.sub(this.u);
};

Segment.prototype.intercept = function(other) {
	var r = this.difference(),
		s = other.difference(),
		
		uNumerator = other.u.sub(this.u).cross(r),
		denominator = r.cross(s);
	
	if (denominator == 0)
		return false;
	
	var u = uNumerator / denominator,
		t = other.u.sub(this.u).cross(s) / denominator;
	
	if ((t > 0) && (t < 1) && (u > 0) && (u < 1))
		return this.u.add(r.scale(t));
	else return false;
};

Segment.prototype.length = function() {
	return v.distance(u);
};
