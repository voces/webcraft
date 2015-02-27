
function randomString(length) {
	var possible = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`" + "abcdefghijklmnopqrstuvwxyz{|}~ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐ" + "ÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";
	
	var id = '';
	
	while (length--)
		id += possible.charAt(Math.floor(Math.random() * possible.length));
	
	return id;
	
}

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
	
	this.meta.date = new Date().toISOString();
	
	this.meta.version = 0;
	
	this.meta.identifier = randomString(8);
	
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
			
			heightMap: new Int16Array(bsize),
			
			tileMaps: [
				new Uint8ClampedArray(ssize*3),
				new Uint8ClampedArray(ssize*3),
				new Uint8ClampedArray(ssize*3),
				new Uint8ClampedArray(ssize*3)
			],
			
			pathingMap: new Uint8ClampedArray(bsize*2),
			
			tileTextures: [
        ['/r/img/terrain/info.png', 4, 4],
        ['/r/img/terrain/Lords/Dirt.png', 8, 4],
				['/r/img/terrain/Lords/Rock.png', 8, 4],
        ['/r/img/terrain/Lords/Grass.png', 8, 4],
        ['/r/img/terrain/Lords/GrassDark.png', 8, 4]
			]
		};
    
    //Set both the top and bottom layers to plain dirt
		var randTile;
    for (var i = 0; i < ssize; i++) {
      
			//Set top to random whole variation
			randTile = Mod.randomTile();
			
			//Loop through all four layers
			for (var n = 0; n < 4; n++) {
				
				//Set to dirt & basic
				this.terrain.tileMaps[n][i*3+2] = 1;
				
				//And set the x/y values to the random variation
				this.terrain.tileMaps[n][i*3] = randTile[0];
				this.terrain.tileMaps[n][i*3+1] = randTile[1];
				
			}
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

Object.defineProperty(Mod.prototype, 'saved', {
	get: function() { return this._saved; },
	set: function(newValue) {
		this._saved = newValue;
		
		//Emit the push event
		mods.emit('savedStateChange', new CustomEvent('savedStateChange', {
			detail: {mod: this, saved: this._saved}
		}));
	}
});

Mod.wholeTiles = [
	[0, 3], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3],
	[5, 0], [5, 1], [5, 2], [5, 3], [6, 0], [6, 1],
	[6, 2], [6, 3], [7, 0], [7, 1], [7, 2], [7, 3]
];

Mod.randomTile = function() {
	var rand = Math.random();
	if (rand < 0.03)
		rand = THREE.Math.randInt(14, 18);
	else if (rand < 0.10)
		rand = THREE.Math.randInt(10, 14);
	else if (rand < 0.25)
		rand = THREE.Math.randInt(6, 10);
	else if (rand < 0.75)
		rand = THREE.Math.randInt(2, 6);
	else
		rand = THREE.Math.randInt(0, 2);
	
	//Restructure the array so we pass by value rather than reference
	return [Mod.wholeTiles[rand][0], Mod.wholeTiles[rand][1]];
	
};

Mod.load = function(file) {
	
	//Define an empty mod
	mod = new Mod();
	
	mod._saved = true;
	
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
	
	//Type our arrays
	mod.terrain.heightMap = new Int16Array(mod.terrain.heightMap);
	
	for (var i = 0; i < 4; i++)
		mod.terrain.tileMaps[i] = new Uint8ClampedArray(mod.terrain.tileMaps[i])
	
	mod.terrain.pathingMap = new Uint8ClampedArray(mod.terrain.pathingMap);
	
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

Mod.prototype.t2g = function(typedArray) {
  return Array.prototype.slice.call(typedArray);
}

Mod.prototype.save = function() {
	
	//Update stuff first
	
	this.meta.date = new Date().toISOString();
	
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
			
			'\t\t"heightMap": ' + JSON.stringify(this.t2g(this.terrain.heightMap)) + ',\n' +
			
			'\t\t"tileMaps": ' + JSON.stringify([this.t2g(this.terrain.tileMaps[0]), this.t2g(this.terrain.tileMaps[1]), this.t2g(this.terrain.tileMaps[2]), this.t2g(this.terrain.tileMaps[3])]) + ',\n' +
			
			'\t\t"pathingMap": ' + JSON.stringify(this.t2g(this.terrain.pathingMap)) + ',\n\n' +
			
			'\t\t"tileTextures": ' + JSON.stringify(this.terrain.tileTextures) + '\n\n' +
			
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
	return this.meta.title + ' ' + this.meta.date;
};
