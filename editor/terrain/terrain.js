
//Takes in a modId, an index in global mods, sets logic.currentMod, creates
//		geometry, modifies it with the heightmap, creates a basic material, and
//		merges it to a mesh, logic.plane, which is added to logic.graphic.scene
logic.loadTerrain = function(modId) {
  
	//Set current mod to input
	this.currentMod = modId;
	
	//For easy access
	var terrain = mods[modId].terrain;
	
	//Remove and delete the previous plane (if it existed)
	if (this.plane != null) {
		this.graphic.scene.remove(this.plane);
		this.plane = null;
	}
	
	//Create geometry
  var geometry = new THREE.PlaneBufferGeometry(
      terrain.width*128, terrain.height*128,
      terrain.width, terrain.height);
	
	//OK, let's apply the height map...
	for (var i = 0; i < terrain.heightMap.length; i++)
		geometry.attributes.position.array[i*3+2] = terrain.heightMap[i];
	
	//Calculate our normals (for lighting)
	geometry.computeVertexNormals();
	
	//Build our active canvas layer (shows live selection, etc)
	this.activeTileMap.canvas = document.createElement('canvas');
	this.activeTileMap.canvas.width = terrain.width;
	this.activeTileMap.canvas.height = terrain.height;
	this.activeTileMap.context = this.activeTileMap.canvas.getContext('2d');
	
	this.activeTileMap.merger = new CanvasMerge(
		this.uintToCanvas(terrain.height, terrain.width, terrain.tileMapPathing, 2),
		this.activeTileMap.canvas
	);
	
	this.activeTileMap.texture = new THREE.Texture(this.activeTileMap.canvas);
	
	//Build the bottom tile layer
	this.tileMapBottomCanvas = this.uintToCanvas(
		terrain.height, terrain.width, terrain.tileMapBottom, 3
	);
	
	this.tileMapBottomTexture = new THREE.Texture(this.tileMapBottomCanvas);
	
	//Build the top tile layer
	this.tileMapTopCanvas = this.uintToCanvas(
		terrain.height, terrain.width, terrain.tileMapTop, 3
	);
	this.tileMapTopContext = this.tileMapTopCanvas.getContext('2d');
	
	this.tileMapTopTexture = new THREE.Texture(this.tileMapTopCanvas);
	
  //Create our material, loading in our textures and tile maps
	var material = TileMaterial({
    width: terrain.width,
		height: terrain.height,
		tileTextures: terrain.tileTextures,
    tileMapBottom: this.tileMapBottomTexture,
    tileMapTop: this.tileMapTopTexture,
    tileMapInfo: this.activeTileMap.texture
    //tileMapInfo: terrain.tileMapActiveTexture
  });
	
	//Create the mesh
  this.plane = new THREE.Mesh(geometry, material);
  this.plane.receiveShadow = true;
  //this.plane.castShadow = true;
  
	//And add it
  this.graphic.scene.add(this.plane);
  
	//Update save status/title
	this.setSavedStatus(mods[modId]._saved);
	
	//Update our keys...
	
	this.panUDKey.min = terrain.height*-64 - 1024;
	this.panUDKey.max = terrain.height*64;// - 1024;
	
	this.panLRKey.min = terrain.width*-64 - 128;
	this.panLRKey.max = terrain.width*64 + 128;
	
};
