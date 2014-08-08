
/*
	Point(number x, number y)
		.x	returns number
		.y	returns number
		
		.add(Point)	returns new Point
		.sub(Point)	returns new Point
		.scale(Number)	returns new Point
		
		.cross(Point)	returns number
		.distance(Point)	returns number
*/

Point = function(x, y) {
	this.x = x;
	this.y = y;
};

Point.prototype.add = function(point) {
	return new Point(this.x + point.x, this.y + point.y);
};

Point.prototype.sub = function(point) {
	return new Point(this.x - point.x, this.y - point.y);
};

Point.prototype.scale = function(scaler) {
	return new Point(this.x * scaler, this.y * scaler);
};

Point.prototype.clone = function(scaler) {
	return new Point(this.x, this.y);
};

Point.prototype.polarOffset = function(distance, angle) {
	return new Point(this.x + distance * Math.cos(angle), this.y + distance * Math.sin(angle));
};

Point.prototype.cross = function(point) {
	return this.x * point.y - this.y * point.x;
};

Point.prototype.distance = function(point) {
	return Math.sqrt((point.x - this.x)*(point.x - this.x) + (point.y - this.y)*(point.y - this.y));
}
