
/*********************************
  Returns a ShaderMaterial
  prop: {
    tileTextures (Array),
		tileMapBottom (THREE.Texture),
		tileMapTop (THREE.Texture),
		tileMapInfo (THREE.Texture)
  }
**********************************/
function TileMaterial(prop) {
	
	//Define our uniform arrays
  var uTexArray = [],
      uTexRatioArray = [],
      uTexTileSizeArray = [],
      uTexMultiplierArray = [],
      uInvTileTexSizeArray = [];
  
	//Grab the values from the tileTextures and put them in our uniforms
  for (var i = 0, tT, tileTexture; tT = prop.tileTextures[i]; i++) {
		tileTexture = new TileTexture(tT);
		
		uTexArray[i] = tileTexture.uTex;
		uTexRatioArray[i] = tileTexture.uTexRatio;
		uTexTileSizeArray[i] = tileTexture.uTexTileSize;
		uTexMultiplierArray[i] = tileTexture.uTexMultiplier;
		uInvTileTexSizeArray[i] = tileTexture.uInvTileTexSize;
	}
  
	//Define a 
  var uTileMapArray = [
    prop.tileMapBottom,
    prop.tileMapTop,
    prop.tileMapInfo
	];
  
	//Set some properties on our loaded textures
  for (var i = 0; i < uTileMapArray.length; i++) {
		uTileMapArray[i].wrapS = uTileMapArray[i].wrapT = THREE.ClampToEdgeWrapping;
		uTileMapArray[i].minFilter = THREE.NearestFilter;
		uTileMapArray[i].magFilter = THREE.NearestFilter;
    
		//Well, this took longer than I'd care to admit to realize it's required
		uTileMapArray[i].needsUpdate = true;
	}
  
  // uniforms
	//For some reason THREE.UniformsUtils.merge breaks shit...
	var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
	
	//Phong is shiny! We don't currently support all our mappings (diffuse, etc)
	uniforms.shininess.value = 5;
	
	//Load our tile-specific uniforms
	uniforms.uTileMapArray = {type: 'tv', value: uTileMapArray};
	uniforms.uTexArray = {type: 'tv', value: uTexArray};
  uniforms.uTexRatioArray = {type: 'fv1', value: uTexRatioArray},
	uniforms.uTexTileSizeArray = {type: 'iv1', value: uTexTileSizeArray},
  uniforms.uTexMultiplierArray = {type: 'v2v', value: uTexMultiplierArray},
	uniforms.uInvTileTexSizeArray = {type: 'v2v', value: uInvTileTexSizeArray},
	
	//For now the infoMap is ignored, this value should be easily adjustable,
	//	especially in the editor
	uniforms.showInfo = {type: 'i', value: 0};
	
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
