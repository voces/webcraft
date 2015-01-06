
function Mod(props) {
	
	props = props || {};
	
	this._saved = false;
	
	/***********************************************
	**	Meta
	************************************************/
	
	this.meta = {};
	
	this.meta.title = props.title || 'Untitled';
	this.meta.author = props.author || 'Unknown';
	this.meta.description = props.description;
	
	var d = new Date();
	this.meta.date = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
	
	this.meta.version = 0;
	
	this.window = window;
	
	/***********************************************
	**	Terrain
	************************************************/
	
	if (props.geoType == 'flat') {
		
		var bsize = (props.width+1) * (props.height+1);
		var ssize = (props.width) * (props.height);
		
		this.terrain = {
			center: {x: 0, y: 0},
			
			width: props.width,
			height: props.height,
			
			heightBias: props.bias || 31,
			
			heightMap: new Uint8ClampedArray(bsize*3),
			tileMap: new Uint8ClampedArray(ssize),
			pathingMap: new Uint8ClampedArray(ssize),
			
			tiles: []
		};
		
		if (this.terrain.heightBias != 0)
			for (var i = 0; i < bsize; i++) {
				this.terrain.heightMap[i*3] = this.terrain.heightBias;
				this.terrain.heightMap[i*3+1] = 127;
				this.terrain.heightMap[i*3+2] = 127;
			}
		
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
		code: ''
	};
	
}

Mod.load = function(file) {
	
	//Define an empty mod
	mod = new Mod();
	
	//Split the file into major sections
	parts = file.split('\n//!! ');
	
	//First thing contains useless stuff...
	parts.shift();
	
	/****************************************************************************
	 **	Meta (it's a long, exciting section
	 ****************************************************************************/
	
	mod.meta = JSON.parse(parts.shift().match(/\/\*+((.|[\r\n])*?)\*\//)[1]);
	
	/****************************************************************************
	 **	Terrain
	 ****************************************************************************/
	
	//First grab the file data
	var terrain = parts.shift();
	terrain = terrain.substr(terrain.indexOf('\n'),
			terrain.lastIndexOf(',') - terrain.indexOf('\n'));
	mod.terrain = JSON.parse("{" + terrain + "}").terrain;
	
	//Now convert the b64 encoded data into uint arrays
	mod.terrain.heightMap = mod.b642uint(mod.terrain.heightMap);
	mod.terrain.tileMap = mod.b642uint(mod.terrain.tileMap);
	mod.terrain.pathingMap = mod.b642uint(mod.terrain.pathingMap);
	
	/****************************************************************************
	 **	Geometry
	 ****************************************************************************/
	
	var geometry = parts.shift();
	geometry = geometry.substr(geometry.indexOf('\n'),
			geometry.lastIndexOf(',') - geometry.indexOf('\n'));
	mod.geometry = JSON.parse("{" + geometry + "}").geometry;
	
	/****************************************************************************
	 **	Widgets
	 ****************************************************************************/
	
	widgets = parts.shift();
	widgets = widgets.substr(widgets.indexOf('\n'),
			widgets.lastIndexOf(';') - 1 - widgets.indexOf('\n'));
	mod.widgets = JSON.parse("{" + widgets + "}").widgets;
	
	/****************************************************************************
	 **	Code (now this one is a bit complicated...)
	 ****************************************************************************/
	
	//Get the text from file
	var code = parts.shift();
	code = code.substr(code.indexOf('\n'));
	
	//Seperate the code into the proper sections
	codeSections = code.split(/\n\/\/!/g);
	
	//Define our variables
	//	cur points to the current object, it starts as this.code, basically
	//	path is an array of accessors, giving us a path of what cur is
	var cur = {},
			path = [cur],
			
			first, level, name, child;
	
	//Loop through the sections
	for (var i = 0, e; e = codeSections[i]; i++) {
		
		//Get the first character (tells us if top level or not)
		first = e.charAt(0);
		
		//Top level, set code and move on
		if (first == '\n')
			cur.code = e.substr(2);
		
		//We're a sub-section, fun time
		else {
			
			//How deep is the section (0 means top section, 1 means sub of that, etc)
			level = e.search(/ /);
			
			//Get the name of the section
			name = e.substr(level + 1, e.indexOf('\n') - level - 1);
			
			//We've entered a parent's sibling, pop to match the path
			while (path.length > level + 1)
				path.pop();
			
			//Modify current to the proper relative
			cur = path[level];
			
			//Set children to an array if not already so
			if (typeof cur.children == 'undefined')
				cur.children = [];
			
			//Create the child
			child = {
				name: name,
				code: e.substr(e.indexOf('\n')+2)
			};
			
			//Add the child to the current node
			cur.children.push(child);
			
			//And add the child to the path (in case the next section is their child)
			path.push(child);
			
		}
	}
	
	//OK, mod.code can be set to Eve/Adam
	mod.code = path[0];
	
	//And we're done!
	return mod;
	
};

//Converts a base64 encoded string into a uint8 array (using a window function,
//	ugh)
Mod.prototype.b642uint = function(b64) {
	return new Uint8ClampedArray(this.window.atob(b64).split('').map(function(c) {
		return c.charCodeAt(0);}));
};

//Converts a uint8 array into a base64 encoded string (using a window function,
//	ugh)
Mod.prototype.uint2b64 = function(uint) {
	return this.window.btoa(String.fromCharCode.apply(null, uint));
};

//Recursively save our code
Mod.prototype.rCodeSave = function(obj, header, level) {
	
	//Append our header as well as our code
	var data =
			(header ?
				'\n//!' + Array(level).join('-') + ' ' + header + '\n\n' :
				'\n'
			) + obj.code;
	
	//Exit if no children
	if (typeof obj.children == 'undefined') return data;
	
	//Loop through all dem children
	for (var i = 0, child; child = obj.children[i]; i++)
		
		//And add them recursively!
		data += this.rCodeSave(child, child.name, level ? level + 1 : 1);
	
	//We're done
	return data;
};

Mod.prototype.save = function() {
	
	//Update stuff first
	
	var d = new Date();
	this.meta.date = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
	
	this.meta.version++;
	
	//OK, now to generate our file
	
	var file = '\n';
	
	//Meta
	file += '//!! Meta\n\n/*' + JSON.stringify(this.meta, null, '\t') + '*/\n\n';
	
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
			
			'\t\t"heightBias": ' + this.terrain.heightBias + ',\n\n' +
			
			'\t\t"heightMap": "' + this.uint2b64(this.terrain.heightMap) + '",\n' +
			'\t\t"tileMap": "' + this.uint2b64(this.terrain.tileMap) + '",\n' +
			'\t\t"pathingMap": "' + this.uint2b64(this.terrain.pathingMap) + '",\n\n'+
			
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
	
	return file;
	
};

Mod.prototype.path = function() {
	return this.meta.title + ' ' + this.meta.date + ' ' + this.meta.version;
};
