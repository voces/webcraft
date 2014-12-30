
function Mod(props) {
	
	props = props || {};
	
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
	
	if (props.geoType == 'flat') {
		
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
	}
	
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

Mod.load = function(file) {
	mod = new Mod();
	
	parts = file.split('\n//!! ');
	
	parts.shift();	//First thing contains useless stuff...
	
	//Meta
	mod.meta = JSON.parse(parts.shift().match(/\/\*!+((.|[\r\n])*?)\*\//)[1]);
	
	//Terrain
	var terrain = parts.shift();
	terrain = terrain.substr(terrain.indexOf('\n'),
			terrain.lastIndexOf(',') - terrain.indexOf('\n'));
	mod.terrain = JSON.parse("{" + terrain + "}").terrain;
	
	mod.terrain.heightMap = mod.b642uint(mod.terrain.heightMap);
	mod.terrain.levelMap = mod.b642uint(mod.terrain.levelMap);
	mod.terrain.tileMap = mod.b642uint(mod.terrain.tileMap);
	mod.terrain.pathingMap = mod.b642uint(mod.terrain.pathingMap);
	
	//Geometry
	var geometry = parts.shift();
	geometry = geometry.substr(geometry.indexOf('\n'),
			geometry.lastIndexOf(',') - geometry.indexOf('\n'));
	mod.geometry = JSON.parse("{" + geometry + "}").geometry;
	
	//Widgets
	widgets = parts.shift();
	widgets = widgets.substr(widgets.indexOf('\n'),
			widgets.lastIndexOf(';') - 1 - widgets.indexOf('\n'));
	mod.widgets = JSON.parse("{" + widgets + "}").widgets;
	
	//Code
	var code = parts.shift();
	code = code.substr(code.indexOf('\n'));
	
	codeSections = code.split(/\n\/\/!/g);
	
	var cur = {};
	var parent = [cur];
	
	for (var i = 0, e; e = codeSections[i]; i++) {
		var first = e.charAt(0);
		
		if (first == '\n')
			cur._value = e.substr(2);
		else {
			
			var level = e.search(/ /);
			var title = e.substr(level + 1, e.indexOf('\n') - level - 1);
			
			if (level == 0) {
				cur = parent[0];
				
				cur[title] = {_value: e.substr(e.indexOf('\n')+2)};
				
				parent = [cur, cur[title]];
			} else {
				parent[level][title] = {_value: e.substr(e.indexOf('\n')+2)};
				parent.push(parent[level][title]);
			}
		}
		
	}
	
	mod.code = parent[0];
	
	return mod;
	
};

Mod.prototype.b642uint = function(b64) {
	return new Uint8ClampedArray(this.window.atob(b64).split('').map(function(c) {
		return c.charCodeAt(0);}));
};

Mod.prototype.uint2b64 = function(uint) {
	return this.window.btoa(String.fromCharCode.apply(null, uint));
};

Mod.prototype.rCodeSave = function(obj, header, level) {
	var data =
			(header ?
				'\n//!' + Array(level).join('-') + ' ' + header + '\n\n' :
				'\n'
			) + obj._value;
	
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop) && prop.substr(0,1) != '_') {
			data += this.rCodeSave(obj[prop], prop, level ? level + 1 : 1);
		}
	}
	
	return data;
};

Mod.prototype.save = function() {
	
	//Update stuff first
	
	var d = new Date();
	this.meta.date = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
	
	this.meta.version++;
	
	//OK, now to generate our file
	
	var file = '\n';
	
	//Meta
	file += '//!! Meta\n\n/*!' + JSON.stringify(this.meta, null, '\t') + '*/\n\n';
	
	//Terrain, widgets, and geometry
	
	file = file +
	
	'var mod = {\n\n' +
	
	'//!! Terrain\n\n' +
	
		'\t"terrain": {\n\n' +
			
			'\t\t"center": {\n' +
				'\t\t\t"x": ' + this.terrain.center.x + ',\n' +
				'\t\t\t"y": ' + this.terrain.center.y + '\n' +
			'\t\t},\n\n' +
			
			'\t\t"width": ' + this.terrain.width + ',\n' +
			'\t\t"height": ' + this.terrain.height + ',\n\n' +
			
			'\t\t"levelBias": ' + this.terrain.levelBias + ',\n\n' +
			
			'\t\t"heightMap": "' + this.uint2b64(this.terrain.heightMap) + '",\n' +
			'\t\t"levelMap": "' + this.uint2b64(this.terrain.levelMap) + '",\n' +
			'\t\t"tileMap": "' + this.uint2b64(this.terrain.tileMap) + '",\n' +
			'\t\t"pathingMap": "' + this.uint2b64(this.terrain.pathingMap) + '",\n\n' +
			
			'\t\t"tiles": ' + JSON.stringify(this.terrain.tiles) + '\n\n' +
			
		'\t},\n\n' +
		
	'//!! Geometry\n\n' +
	
		'\t"geometry": {\n' +
			'\t\t"points": ' + JSON.stringify(this.geometry.points) + ',\n' +
			'\t\t"shapes": ' + JSON.stringify(this.geometry.shapes) + '\n' +
		'\t},\n\n' +
	
	'//!! Widgets\n\n' +
		
		'\t"widgets": ' + JSON.stringify(this.widgets) + '\n' +
		
	'};\n\n';
	
	//Code
	file += '//!! Code\n' + this.rCodeSave(this.code);
	
	this.window.download(this.path() + ".js", file);
	
	//return file;
	
};

Mod.prototype.path = function() {
	return this.meta.title + ' ' + this.meta.date + ' ' + this.meta.version;
};
