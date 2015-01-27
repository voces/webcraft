
logic.terrainPalette = {
	
};

logic.initTerrainPalette = function() {
	
	var radios = document.terrain.heightRadios;
	
	for (var i = 0, radio; radio = radios[i]; i++)
		radio.addEventListener('change',
				this.terrainPalette.heightRadioChanged.bind(this));
	
};

logic.terrainPalette.heightRadioChanged = function(e) {
	console.log(e, this);
	this.transformers.list[0].enabled = true;
};
