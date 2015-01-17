
function initShaders(shaders, uTexArray) {

shaders.vertexShader = [
	
	'varying vec2 vPixelCoord;',
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
	
	'varying vec2 vPixelCoord;',

	'uniform sampler2D uTileMapArray[3];',

	'uniform sampler2D uTexArray[' + uTexArray.length + '];',
	'uniform vec2 uTexMultiplierArray[' + uTexArray.length + '];',
	'uniform vec2 uInvTileTexSizeArray[' + uTexArray.length + '];',
	'uniform float uTexRatioArray[' + uTexArray.length + '];',
	
	'uniform vec2 uTextureVariationMultiplier;',
	'uniform vec2 uInverseTileTextureSize;',
	
	'uniform int showInfo;',
	
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
		
		'vec4 pColor = vec4(0, 0, 0, 1.0);',
		
		'vec4 tile;',
		'int textureIndex;',
		'vec2 variationOffset;',
		'vec2 uUv;',
		
		'for (int i = 0; i < 3; i++) {',
			
			'if (showInfo < 1 && i == 2) break;',
			
			'tile = texture2D(uTileMapArray[i], vec2(',
				'vPixelCoord.x, vPixelCoord.y',
			'));',
			
			'textureIndex = int(tile.b * 255.0);',
			
			'for (int n = 0; n < ' + uTexArray.length + '; n++) {',
				'if (n == textureIndex) {',
					
					'vec2 pixelOffset = vec2(',
						'mod(vPixelCoord.x, uInvTileTexSizeArray[n].x),',
						'mod(vPixelCoord.y * uTexRatioArray[n],',
								'uInvTileTexSizeArray[n].y)',
					');',
					
					'variationOffset = tile.rg * uTexMultiplierArray[n];',
					
					'uUv = vec2(',
						'variationOffset.x + pixelOffset.x,',
						'variationOffset.y + pixelOffset.y',
					');',
					
					'vec4 tColor = texture2D(uTexArray[n], uUv);',
					
					'pColor = mix(pColor, tColor, tColor.a);',
					
					'break;',
				'}',
			'}',
		'}',
		
		'pColor.a = 1.0;',
		
		'gl_FragColor = pColor;',
		
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
