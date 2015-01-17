
//function TileTexture(parameter) {
function TileTexture(parameter) {
	
	this.uTex = new THREE.ImageUtils.loadTexture(parameter.tex);
	
	this.uTex.wrapS = this.uTex.wrapT = THREE.ClampToEdgeWrapping;
	this.uTex.minFilter = this.uTex.magFilter = THREE.NearestFilter;
	
	this.uTexRatio = parameter.horizontalTiles/parameter.verticalTiles;
	this.uTexTileSize = parameter.texTileSize;
	this.uTexMultiplier = new THREE.Vector2(255/parameter.horizontalTiles,
			255/parameter.verticalTiles);
	this.uInvTileTexSize = new THREE.Vector2(1/parameter.horizontalTiles,
			1/parameter.verticalTiles);
}
