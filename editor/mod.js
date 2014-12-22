
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
	
	this.terrain = {
		center: {x: 0, y: 0},
		
		width: props.width,
		height: props.height,
		
		heightMap: new Uint8ClampedArray(props.width * props.height),
		levelMap: new Uint8ClampedArray(props.width * props.height),
		tileMap: new Uint8ClampedArray(props.width * props.height),
		pathingMap: new Uint8ClampedArray(props.width * props.height),
		
		tiles: []
	};
	
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
	
}

Mod.load = function(obj) {
	
}

Mod.prototype.path = function() {
	return this.meta.title + " " + this.meta.date + " " + this.meta.version;
}
