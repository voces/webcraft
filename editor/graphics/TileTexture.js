
function TileTexture(prop) {
	
	this.uTex = new THREE.ImageUtils.loadTexture(prop[0]);
	
	this.uTex.wrapS = this.uTex.wrapT = THREE.ClampToEdgeWrapping;
	this.uTex.minFilter = this.uTex.magFilter = THREE.NearestFilter;
	
	this.uTexRatio = prop[1]/prop[2];
	this.uTexTileSize = prop[3];
	this.uTexMultiplier = new THREE.Vector2(255/prop[1],
			255/prop[2]);
	this.uInvTileTexSize = new THREE.Vector2(1/prop[1],
			1/prop[2]);
}
