
function initShaders(shaders, uTexArray) {

shaders.vertexShader = [
	
	//Used for tile picker (see fragment shader)
	'varying vec2 vPixelCoord;',
	
	//User for lighting (adopted from Phong)
	//	Anything not commented is from Phong
	
	'varying vec3 vPos;',
	'varying vec3 vecNormal;',
	
	"varying vec3 vViewPosition;",
	"varying vec3 vNormal;",
	
	THREE.ShaderChunk[ "map_pars_vertex" ],
	THREE.ShaderChunk[ "lightmap_pars_vertex" ],
	THREE.ShaderChunk[ "envmap_pars_vertex" ],
	THREE.ShaderChunk[ "lights_phong_pars_vertex" ],
	THREE.ShaderChunk[ "color_pars_vertex" ],
	THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
	THREE.ShaderChunk[ "skinning_pars_vertex" ],
	THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
	THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],
	
	'void main() {',
		
		//Set our varying...
		'vPixelCoord = uv;',
		
		THREE.ShaderChunk[ "map_vertex" ],
		THREE.ShaderChunk[ "lightmap_vertex" ],
		THREE.ShaderChunk[ "color_vertex" ],

		THREE.ShaderChunk[ "morphnormal_vertex" ],
		THREE.ShaderChunk[ "skinbase_vertex" ],
		THREE.ShaderChunk[ "skinnormal_vertex" ],
		THREE.ShaderChunk[ "defaultnormal_vertex" ],

	"	vNormal = normalize( transformedNormal );",

		THREE.ShaderChunk[ "morphtarget_vertex" ],
		THREE.ShaderChunk[ "skinning_vertex" ],
		THREE.ShaderChunk[ "default_vertex" ],
		THREE.ShaderChunk[ "logdepthbuf_vertex" ],

	"	vViewPosition = -mvPosition.xyz;",

		THREE.ShaderChunk[ "worldpos_vertex" ],
		THREE.ShaderChunk[ "envmap_vertex" ],
		THREE.ShaderChunk[ "lights_phong_vertex" ],
		THREE.ShaderChunk[ "shadowmap_vertex" ],
		
	'}'
		
].join('\n');

shaders.fragmentShader = [
	
	//Our tile picker value, ranges ([0-1], [0-1])
	'varying vec2 vPixelCoord;',
	
	//(1/width, 1/height)
	'uniform vec2 uInvTiles;',
	'uniform vec2 uInvTilesArray[3];',
	'uniform vec2 uTilesOffsetArray[3];',
	
	//3 for each layer (bottom, top, info)
	'uniform sampler2D uTileMapArray[3];',
	
	//Arrays for our texture
	
	//Textures
	'uniform sampler2D uTexArray[' + uTexArray.length + '];',
	
	//(255 / texWidth [in tiles], 255 / texHeight [in tiles])
	'uniform vec2 uTexMultiplierArray[' + uTexArray.length + '];',
	
	//Like textures, except this is the mappings texture (generated)
	'uniform vec2 uTileTexMultiplierArray[' + uTexArray.length + '];',
	
	//A simple variable indicating whether to display any info
	//	This probably isn't required, as the fed texture should just be blank
	//	if we don't want anything...
	'uniform int uShowInfo;',
	
	//Lighting stuff
	
	'uniform vec3 diffuse;',
	'uniform vec3 ambient;',
	'uniform vec3 emissive;',
	'uniform vec3 specular;',
	'uniform float shininess;',
	
	THREE.ShaderChunk[ "color_pars_fragment" ],
	THREE.ShaderChunk[ "map_pars_fragment" ],
	THREE.ShaderChunk[ "alphamap_pars_fragment" ],
	THREE.ShaderChunk[ "lightmap_pars_fragment" ],
	THREE.ShaderChunk[ "envmap_pars_fragment" ],
	THREE.ShaderChunk[ "fog_pars_fragment" ],
	THREE.ShaderChunk[ "lights_phong_pars_fragment" ],
	THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
	THREE.ShaderChunk[ "bumpmap_pars_fragment" ],
	THREE.ShaderChunk[ "normalmap_pars_fragment" ],
	THREE.ShaderChunk[ "specularmap_pars_fragment" ],
	THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],
	
	'void main() {',
		
		//Start out with black
		'vec4 pColor = vec4(0, 0, 0, 1.0);',
		
		//Define some variables we'll need
		'vec4 tile;',
		'int textureIndex;',
		'vec2 variationOffset;',
		'vec2 uUv;',
		'vec2 adjustedUv;',
		
		//Loop through our layers (fixed size, 0,1,2)
		'for (int i = 0; i < 3; i++) {',
			
			//Grab the matching tile; the info layer is slightly larger and offset
			'if (i == 2) {',
				
				//Skip if we're on the info layer and it's hidden
				'if (uShowInfo == 0) break;',
				
				'if (vPixelCoord.x < uInvTiles.x / 2.0) {',
					'adjustedUv.x = 0.0;',
				'} else if (1.0 - vPixelCoord.x < uInvTiles.x / 2.0) {',
					'adjustedUv.x = 1.0;',
				'} else {',
					'adjustedUv.x = (vPixelCoord.x - uInvTiles.x / 2.0) *',
							'(uInvTilesArray[2].x / uInvTilesArray[0].x) + uInvTiles.x;',
				'}',
				
				'if (vPixelCoord.y < uInvTiles.y / 2.0) {',
					'adjustedUv.y = 0.0;',
				'} else if (1.0 - vPixelCoord.y < uInvTiles.y / 2.0) {',
					'adjustedUv.y = 1.0;',
				'} else {',
					'adjustedUv.y = (vPixelCoord.y - uInvTiles.y / 2.0) *',
							'(uInvTilesArray[2].y / uInvTilesArray[0].y) + uInvTiles.y;',
				'}',
				
				'tile = texture2D(uTileMapArray[i], adjustedUv);',
			
			//Grab the matching tile (remember vPixelCoord is (0-1, 0-1), so the tile
			//	maps are a direct correspondence)
			'} else {',
				'tile = texture2D(uTileMapArray[i], vec2(vPixelCoord.x,',
						'vPixelCoord.y));',
			'}',
			
			//Texture is stored in the b value of rgb; multiple by 255 to make it
			//	0-255 instead of 0-1
			'textureIndex = int(tile.b * 255.0);',
			
			//Loop through all textures (we can't use textureIndex as an actual index
			//	but can use a looped int)
			'for (int n = 0; n < ' + uTexArray.length + '; n++) {',
				
				//Only do something if the texture matches
				'if (n == textureIndex) {',
					
					//variationOffset determines which variation within a tile we're
					//	working with. Result is (0-1, 0-1), but it's going to be a
					//	multiple of uTexMultiplierArray, which is 1/tileTexSize, where
					//	tileTexSize is the width (or height, they must be the same) of a
					//	variation within a texture
					'variationOffset = tile.rg * uTexMultiplierArray[n];',
					
					//We now need a pixel offset. This is going to be a value
					//	(0-(1/tileTexSize), 0-(1/tileTexSize)) (see above). The y value is
					//	slightly modified due to a picking issue with texture2D sampling.
					//	1/510 is 1/255/2 (i.e., half a "pixel"), multiply by uInvTiles.y
					//	because IDK (it works!) TODO: check if 1/510 calculated each time
					'vec2 pixelOffset;',
					'if (n == 0) {',
					'pixelOffset = vec2(',
						'mod(vPixelCoord.x, uInvTiles.x) / uTileTexMultiplierArray[n].x,',
						'(mod(vPixelCoord.y, uInvTiles.y - 1.0/510.0 * uInvTiles.y)) / uTileTexMultiplierArray[n].y',
					');',
					'} else {',
					'pixelOffset = vec2(',
						'mod(vPixelCoord.x, uInvTiles.x) / uTileTexMultiplierArray[n].x,',
						'(mod(vPixelCoord.y, uInvTiles.y)) / uTileTexMultiplierArray[n].y',
					');',
					'}',
					
					//Add our variation and pixel offsets to get the final location in the
					//	texture
					'uUv = vec2(',
						'variationOffset.x + pixelOffset.x,',
						'variationOffset.y + pixelOffset.y',
					');',
					
					//And grab that color
					'vec4 tColor = texture2D(uTexArray[n], uUv);',
					
					//And mix it with what we had (layers!)
					'pColor = mix(pColor, tColor, tColor.a);',
					
					//And exit the loop that goes through textures, as we are working in
					//	the found one
					'break;',
				'}',
			'}',
		'}',
		
		//Mixing modifies alpha; we don't want ANY transparency
		'pColor.a = 1.0;',
		
		//And set our color
		'gl_FragColor = pColor;',
		
		//Lighting...
		
		THREE.ShaderChunk[ "logdepthbuf_fragment" ],
		THREE.ShaderChunk[ "map_fragment" ],
		THREE.ShaderChunk[ "alphamap_fragment" ],
		THREE.ShaderChunk[ "alphatest_fragment" ],
		THREE.ShaderChunk[ "specularmap_fragment" ],

		THREE.ShaderChunk[ "lights_phong_fragment" ],

		THREE.ShaderChunk[ "lightmap_fragment" ],
		THREE.ShaderChunk[ "color_fragment" ],
		THREE.ShaderChunk[ "envmap_fragment" ],
		THREE.ShaderChunk[ "shadowmap_fragment" ],

		THREE.ShaderChunk[ "linear_to_gamma_fragment" ],

		THREE.ShaderChunk[ "fog_fragment" ],
		
	'}',

].join('\n');

};
