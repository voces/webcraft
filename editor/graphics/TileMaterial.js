
/*********************************
  Returns a ShaderMaterial
  prop: {
		width (Integer),
		height (Integer),
    tileTextures (Array),
		tileMapBottom (THREE.Texture),
		tileMapTop (THREE.Texture),
		tileMapInfo (THREE.Texture)
  }
**********************************/
function TileMaterial(prop) {
	
	//Define our uniform arrays
  var uTexArray = [],
      uTexMultiplierArray = [],
      uTileTexMultiplierArray = [];
  
	//Grab the values from the tileTextures and put them in our uniforms
  for (var i = 0, tT, tileTexture; tT = prop.tileTextures[i]; i++) {
		tileTexture = new TileTexture(tT, prop.width, prop.height);
		
		uTexArray[i] = tileTexture.uTex;
		uTexMultiplierArray[i] = tileTexture.uTexMultiplier;
		uTileTexMultiplierArray[i] = tileTexture.uTileTexMultiplier;
	}
  
	//Define the tile map array...
  var uTileMapArray = [
    prop.tileMapBottom,
    prop.tileMapTop,
    prop.tileMapInfo
	];
  
	//Set some properties on our loaded tile map textures
  for (var i = 0; i < uTileMapArray.length; i++) {
		uTileMapArray[i].wrapS = uTileMapArray[i].wrapT = THREE.ClampToEdgeWrapping;
		uTileMapArray[i].minFilter = uTileMapArray[i].magFilter =
				THREE.NearestFilter;
    
		//Well, this took longer than I'd care to admit to realize it's required
		uTileMapArray[i].needsUpdate = true;
	}
  
  // uniforms
	//For some reason THREE.UniformsUtils.merge breaks shit...
	var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
	
	//Phong is shiny! We don't currently support all our mappings (diffuse, etc)
	uniforms.shininess.value = 1;
	
	//Load our tile-specific uniforms
	
	uniforms.uInvTiles = {type: 'v2', value: new THREE.Vector2(
			1/prop.width, 1/prop.height
	)};
	
	uniforms.uTileMapArray = {type: 'tv', value: uTileMapArray};
	uniforms.uTexArray = {type: 'tv', value: uTexArray};
  uniforms.uTexMultiplierArray = {type: 'v2v', value: uTexMultiplierArray},
	uniforms.uTileTexMultiplierArray = {type: 'v2v',
			value: uTileTexMultiplierArray},
	
	uniforms.uShowInfo = {type: 'i', value: 1};
	
	// shaders (sets first, uses second)
	var shaders = {};
	initShaders(shaders, uTexArray);
	
	// material
	return new THREE.ShaderMaterial({
		uniforms: uniforms,
		attributes: {},
		vertexShader: shaders.vertexShader,
		fragmentShader: shaders.fragmentShader,
		transparent: true,
		lights: true,
		fog: true
	});
}
