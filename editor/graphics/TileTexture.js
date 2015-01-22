
function TileTexture(prop, width, height) {
	
	width = width || 1;
	height = height || 1;
	
	this.uTex = new THREE.ImageUtils.loadTexture(prop[0]);
	
	this.uTex.wrapS = this.uTex.wrapT = THREE.ClampToEdgeWrapping;
	this.uTex.minFilter = this.uTex.magFilter = THREE.NearestFilter;
	
	this.uTexMultiplier = new THREE.Vector2(
			255 / prop[1],
			255 / prop[2]
	);
	this.uTileTexMultiplier = new THREE.Vector2(
			prop[1] / width,
			prop[2] / height
	);
	
}
