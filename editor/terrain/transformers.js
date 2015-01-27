
/******************************************************************************
 ******************************************************************************
 *	Transformers
 ******************************************************************************
 ******************************************************************************/

logic.transformers.list[0].func = 
logic.heightTransform = function(vertex) {
	
	var width = mods[this.currentMod].terrain.width;
	var arr = this.plane.geometry.attributes.position.array;
	
	arr[vertex*3+2] += 8;
	arr[(vertex+1)*3+2] += 8;
	arr[(vertex+width+1)*3+2] += 8;
	arr[(vertex+width+2)*3+2] += 8;
	
	this.plane.geometry.computeVertexNormals();
	
	this.plane.geometry.attributes.position.needsUpdate = true;
	
}.bind(logic);

/******************************************************************************
 ******************************************************************************
 *	Misc (support)
 ******************************************************************************
 ******************************************************************************/

logic.getVertices = function(primary) {
	
};

logic.getIntersect = function(mouse) {
	
	//Set our raycaster
	this.raycaster.setFromCamera(mouse, this.graphic.camera);
	
	//Cast it against the plane and grab the intersect
	var intersect = this.raycaster.intersectObjects([this.plane])[0];
	
	//Quit if no intersect
	if (!intersect) return;
	
	//Adjust location of our UI point
	this.point.position.copy(intersect.point);
	document.getElementById('status').textContent = 'Point (' +
			Math.round(intersect.point.x) + ', ' +
			Math.round(intersect.point.y) + ', ' +
			Math.round(intersect.point.z) + ')';
	
	//Set position (vertex) array for easy access
	var arr = this.plane.geometry.attributes.position.array;
	
	//Grab the corresponding vertex (top left)
	var vertex;
	if ((intersect.face.a + intersect.face.b + intersect.face.c) % 3 == 2)
		vertex = intersect.face.a;
	else
		vertex = intersect.face.c - 1;
	
	return vertex;// - Math.floor(vertex / (mods[this.currentMod].terrain.width + 1));
	
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
		if (this.currentCamera == 'world') {
			this.currentCamera = 'preview';
			
			this.panLRKey.obj = this.graphic.previewCamera.position;
			this.panUDKey.obj = this.graphic.previewCamera.position;
			this.angleKey.obj = this.graphic.previewCamera.rotation;
			this.zoomKey.obj = this.graphic.previewCamera.position;
		}
	} else if (this.currentCamera == 'preview') {
		this.currentCamera = 'world';
		
		this.panLRKey.obj = this.graphic.camera.position;
		this.panUDKey.obj = this.graphic.camera.position;
		this.angleKey.obj = this.graphic.camera.rotation;
		this.zoomKey.obj = this.graphic.camera.position;
	}
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	this.mouse.x = ((e.clientX - 257) / (this.graphic.box.clientWidth - 257)) * 2 - 1;
	this.mouse.y = ((e.clientY - 33) / this.graphic.box.clientHeight) * -2 + 1;
	
	//Grab the vertex
	var vertex = this.getIntersect(this.mouse);
	
	//Grab the width and height (width is + 1 for later calculations)
	var width = mods[this.currentMod].terrain.width;
	var height = mods[this.currentMod].terrain.height;
	
	//Convert vertex into tile
	tile = vertex - Math.floor(vertex / (width+1));
	
	//Get the coordinates of the tile
	var x = tile % width;
	var y = Math.floor(tile / width);
	
	//Clear the entire active canvas
	this.activeTileMap.context.clearRect(0, 0, width, height);
	
	//Set our color to green (selection)
	this.activeTileMap.context.fillStyle = '#010100';
	
	//Draw it
	this.activeTileMap.context.fillRect(x, y, 1, 1);
	
	//Recalc & update
	this.activeTileMap.merger.recalc();
	this.activeTileMap.texture.needsUpdate = true;
	
	for (var i = 0, transformer; transformer = this.transformers.list[i]; i++)
		if (transformer.active)
			transformer.func(vertex);
	
}

logic.onClick = function(e) {
	
	//Normalize the mouse coordinates ([-1, 1], [-1, 1])
	this.mouse.x = ((e.clientX - 257) / (this.graphic.box.clientWidth - 257)) * 2 - 1;
	this.mouse.y = ((e.clientY - 33) / this.graphic.box.clientHeight) * -2 + 1;
	
	//Grab the vertex
	var vertex = this.getIntersect(this.mouse);
	
	for (var i = 0; i < this.transformers.list.length; i++)
		this.transformers.list[i].func(vertex);
	
};

logic.onMouseDown = function(e) {
	
	if (e.target.id != 'world') return;
	
	this.transformers.list[0].active = true;
	
};

logic.onMouseUp = function(e) {
	
	if (e.target.id != 'world') return;
	
	this.transformers.list[0].active = false;
	
};
