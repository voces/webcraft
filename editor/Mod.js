
function Mod(props) {
	
	/***********************************************
	**	Meta
	************************************************/
	
	this.meta = {};
	
	this.meta.title = props.title || 'Untitled';
	this.meta.author = props.author || 'Unknown';
	this.meta.description = props.description;
	
	var d = new Date();
	this.meta.date = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
	
	this.meta.version = 0;
	
	this.window = window;
	
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
		_value: 'function someTest() {\n\t\n}\n',
		Utils: {
			_value: 'function anotherTest() {\n\t\n}\n',
			Magic: {
				_value: 'var MAGICZ = Infinity;'
			}
		}
	};
	
}

Mod.load = function(obj) {
	
};

Mod.prototype.uint2btoa = function(uint) {
	return this.window.btoa(String.fromCharCode.apply(null, uint));
};

Mod.prototype.rCode = function(obj, header, level) {
	var data =
			(header ?
				'\n//!' + Array(level).join('-') + ' ' + header + '\n\n' :
				'\n'
			) + obj._value;
	
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop) && prop.substr(0,1) != '_') {
			data += this.rCode(obj[prop], prop, level ? level + 1 : 1);
		}
	}
	
	return data;
};

Mod.prototype.save = function() {
	
	var file = '';
	
	//Meta
	file += '//!! Meta\n\n/*' + JSON.stringify(this.meta, null, '\t') + '*/\n\n';
	
	//Terrain, widgets, and geometry
	
	file = file +
	
	'_var mod = {\n\n' +
	
	'//!! Terrain\n\n' +
	
		'\tterrain: {\n\n' +
			
			'\t\tcenter: {\n' +
				'\t\t\tx: ' + this.terrain.center.x + ',\n' +
				'\t\t\ty: ' + this.terrain.center.y + '\n' +
			'\t\t},\n\n' +
			
			'\t\twidth: ' + this.terrain.width + ',\n' +
			'\t\theight: ' + this.terrain.height + ',\n\n' +
			
			'\t\theightMap: "' + this.uint2btoa(this.terrain.heightMap) + '",\n' +
			'\t\tlevelMap: "' + this.uint2btoa(this.terrain.levelMap) + '",\n' +
			'\t\ttileMap: "' + this.uint2btoa(this.terrain.tileMap) + '",\n' +
			'\t\tpathingMap: "' + this.uint2btoa(this.terrain.pathingMap) + '",\n\n' +
			
			'\t\ttiles: ' + JSON.stringify(this.terrain.tiles) + '\n\n' +
			
		'\t},\n\n' +
		
	'//!! Geometry\n\n' +
	
		'\tgeometry: {\n' +
			'\t\tpoints: ' + JSON.stringify(this.geometry.points) + ',\n' +
			'\t\tshapes: ' + JSON.stringify(this.geometry.shapes) + ',\n' +
		'\t},\n\n' +
	
	'//!! Widgets\n\n' +
		
		'\twidgets: ' + JSON.stringify(this.widgets) + '\n' +
		
	'};\n\n';
	
	//Code
	file += '//!! Code\n' + this.rCode(this.code) + '\n';
	
	return file;
	
};

Mod.prototype.path = function() {
	return this.meta.title + ' ' + this.meta.date + ' ' + this.meta.version;
}
