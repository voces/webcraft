
//logic.plane.material.uniforms.uTileMapArray.value[0].image
//With some activeImage
function CanvasMerge(bottom, top) {
	this.bottom = bottom;
	this.top = top;
	
	this.canvas = document.createElement('canvas');
	this.canvas.width = bottom.width;
	this.canvas.height = bottom.height;
	
	this.context = this.canvas.getContext('2d');
	
	this.context.drawImage(bottom, 0, 0);
	this.context.drawImage(top, 0, 0);
	
};

CanvasMerge.prototype.recalc = function() {
	
	this.context.drawImage(bottom, 0, 0);
	this.context.drawImage(top, 0, 0);
	
};
