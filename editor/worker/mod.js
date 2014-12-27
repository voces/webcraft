
function Mod(props) {
	
	/***********************************************
	**	Meta
	************************************************/
	
	this.meta = {};
	
	this.meta.title = props.title || "Untitled";
	this.meta.author = props.author || "Unknown";
	this.meta.description = props.description;
	
	var d = new Date();
	this.meta.date = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
	
	this.meta.version = 0;
	
	/***********************************************
	**	Terrain
	************************************************/
	
	//We assume it's flat for now...
	
	var size = (props.width+1) * (props.height+1);
	
	this.terrain = {
		center: {x: 0, y: 0},
		
		width: props.width,
		height: props.height,
		
		levelBias: props.bias || 31,
		
		heightMap: new Uint8ClampedArray(size),
		levelMap: new Uint8ClampedArray(size),
		tileMap: new Uint8ClampedArray(size),
		pathingMap: new Uint8ClampedArray(size),
		
		tiles: []
	};
	
	if (this.terrain.levelBias != 0)
		for (var i = 0; i < size; i++)
			this.terrain.levelMap[i] = this.terrain.levelBias;
	
	/***********************************************
	**	Widgets
	************************************************/
	
	this.widgets = [];
	
	/***********************************************
	**	Geometry
	************************************************/
	
	this.geometry = {
		points: [],
		shapes: []
	};
	
	/***********************************************
	**	Code
	************************************************/
	
	this.code = {
		_value: "function test() {\n\n}\n",
		Utils: {
			_value: "function test2() {\n\n}\n"
		}
	};
	
}

Mod.load = function(obj) {
	
}

Mod.prototype.path = function() {
	return this.meta.title + " " + this.meta.date + " " + this.meta.version;
}
