
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	initializers: [],
	
	graphic: null,
	
	//Objects we need
	mouse: new THREE.Vector2(),
	mouseRaw: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	plane: null,
	
	activeTileMap: {},
	
	//Integer value of the currently loaded mod
	currentMod: null,
	
	windowActive: true,
	
	settings: {
		showPathingMap: false,
		transformations: [
		]
	},
	
	/****************************************************************************
	 ****************************************************************************
	 *	Init
	 ****************************************************************************
	 ****************************************************************************/
	
	init: function() {
		
		/**************************************************************************
		 **	Build our graphics and attach graphic-related values
		 **************************************************************************/
		
		//The object
		this.graphic = new Graphic(document.getElementById('world'));
		
		/**************************************************************************
		 **	Events
		 **************************************************************************/
		
		//Mouse
		document.getElementById('world').addEventListener('mousemove', this.onMouseMove.bind(this));
		
		/**************************************************************************
		 **	Some UI stuff (will probably remove)
		 **************************************************************************/
		
		//Either the box or the point must be visible, else shadows cry
		
    var box = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshPhongMaterial());
    box.castShadow = true;
    box.position.z = 192;
    this.graphic.scene.add(box);
    
		this.point = new Point(8, 0xffffff);
		//this.graphic.scene.add(this.point);
		
		/**************************************************************************
		 **	Load attached initilizers
		 **************************************************************************/
		
		for (var i = 0; i < this.initializers.length; i++)
			this.initializers[i]();
		
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0; i < mods.length; i++)
			if (mods[i] != null)
				this.menu.newMod({detail: {mod: mods[i], id: i}}, i);
		
		/**************************************************************************
		 **	Initial mod
		 **************************************************************************/
		
		if (mods.length != 0) return;
		
		//Create the mod
		var mod = new Mod({
			title: 'Untitled',
			author: 'Unknown',
			geoType: 'flat',
			height: 15,
			width: 20
		});
		var id = mods.push(mod) - 1;
		
		//Build an event
		mods.emit('push', new CustomEvent('push', {
			detail: {mod: mod, id: id}
		}));
		
	}
};

logic.intersectCornerVertex = function(intersect) {
	
	//Quit if no intersect
	if (!intersect) return null;
	
	//Grab the corresponding vertex (top left)
	var vertex;
	if (intersect.face.a + 1 == intersect.face.c)
		vertex = intersect.face.a;
	else
		vertex = intersect.face.c - 1;
	
	//Return the top-left corner vertex
	return vertex;
	
};

logic.intersectClosestVertex = function(intersect) {
	
	//Quit if no intersect
	if (!intersect) return null;
	
	//Grab the four possible candidates (two triangles make up a face)
	var candidates;
	if (intersect.face.a + 1 == intersect.face.c)
		candidates = [intersect.face.a, intersect.face.c,
				intersect.face.b, intersect.face.b + 1];
		
	else
		candidates = [intersect.face.c - 1, intersect.face.c,
				intersect.face.b - 1, intersect.face.b];
	
	//Grab the positions array [x1, y1, z1, x2, y2, z2, ... etc]
	var arr = logic.plane.geometry.attributes.position.array;
	
	//Set our vertex to the first one
	var vertex = candidates[0];
	var minDistance = Math.sqrt(
		((intersect.point.x - arr[candidates[0]*3])*
				(intersect.point.x - arr[candidates[0]*3])) + 
		((intersect.point.y - arr[candidates[0]*3+1])*
				(intersect.point.y - arr[candidates[0]*3+1]))
	);
	
	//Now compare against the other three
	for (var i = 1, attempt; i < 4; i++) {
		attempt = Math.sqrt(
			(intersect.point.x - arr[candidates[i]*3])*
					(intersect.point.x - arr[candidates[i]*3]) + 
			(intersect.point.y - arr[candidates[i]*3+1])*
					(intersect.point.y - arr[candidates[i]*3+1])
		);
		
		if (attempt < minDistance) {
			minDistance = attempt;
			vertex = candidates[i];
		}
	}
	
	//Return the closest vertex
	return vertex;
	
};

logic.getIntersect = function(mouse) {
	
	//Set our raycaster
	logic.raycaster.setFromCamera(mouse, logic.graphic.camera);
	
	//Cast it against the plane and grab the intersect
	var intersect = logic.raycaster.intersectObjects([logic.plane])[0];
	
	//Quit if no intersect
	if (!intersect) return null;
	
	return intersect;
	
};

/******************************************************************************
 ******************************************************************************
 *	Events
 ******************************************************************************
 ******************************************************************************/

logic.onMouseMove = function(e) {
	
	//Store the raw location of the mouse
	this.mouseRaw.x = e.pageX;
	this.mouseRaw.y = e.pageY;
	
	//A switcher to determine if we're in preoview or world camera
	//	Used for camera movements/tilts
	if (this.mouseRaw.y > 33 && this.mouseRaw.y < 290 && this.mouseRaw.x < 257) {
		if (this.camera.current == 'world') this.camera.current = 'preview';
	} else if (this.camera.current == 'preview')
		this.camera.current = 'world';
	
	//Don't bother if there is no plane
	if (!logic.plane) return;
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	this.mouse.x = ((e.clientX - 257) / (this.graphic.box.clientWidth - 257)) * 2 - 1;
	this.mouse.y = ((e.clientY - 33) / this.graphic.box.clientHeight) * -2 + 1;
	
	var intersect = this.getIntersect(this.mouse);
	
	if (!intersect) return;
	
	//Display location
	document.getElementById('status').textContent = 'Point (' +
			Math.round(intersect.point.x) + ', ' +
			Math.round(intersect.point.y) + ', ' +
			Math.round(intersect.point.z) + ')';
	
	//Grab the vertex
	var closestVertex = this.intersectClosestVertex(intersect);
	
	//Quit if vertex is empty
	if (closestVertex == null) return;
	
	//Grab the width and height
	var width = mods[this.currentMod].terrain.width + 1;
	var height = mods[this.currentMod].terrain.height + 1;
	
	//Get the coordinates of the vertex
	var x = closestVertex % width;
	var y = Math.floor(closestVertex / width);
	
	//Clear the entire active canvas
	this.activeTileMap.context.clearRect(0, 0, width, height+1);
	
	//Set our color to green (selection)
	this.activeTileMap.context.fillStyle = '#010100';
	
	//Grab the size of the area
	var size = document.terrain.tbSizeOut.value - 1;
	
	//Draw it
	this.activeTileMap.context.fillRect(x-size, y-size, 1+size*2, 1+size*2);
	
	//Recalc & update
	this.activeTileMap.merger.recalc();
	this.activeTileMap.texture.needsUpdate = true;
	
	logic.fireTransformers(intersect, closestVertex);
	
}
