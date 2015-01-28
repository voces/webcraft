
logic.terrainPalette = {
	
};

logic.initTerrainPalette = function() {
	
	/****************************************************************************
	 **	Texture
	 ****************************************************************************/
	
	
	
	/****************************************************************************
	 **	Height
	 ****************************************************************************/
	
	//Height
	document.terrain.taHeight.addEventListener('click',
			this.terrainPalette.heightToggle.bind(this));
	
	//Height radios
	var radios = document.terrain.heightRadios;
	for (var i = 0, radio; radio = radios[i]; i++)
		radio.addEventListener('click',
				this.terrainPalette.heightRadioChanged.bind(this));
	
	/****************************************************************************
	 **	Brush
	 ****************************************************************************/
	
	//Size
	document.terrain.tbSizeIn.addEventListener('input',
			logic.terrainPalette.sizeChange.bind(this));
	
	//Strength
	document.terrain.tbStrengthIn.addEventListener('input',
			logic.terrainPalette.strengthChange.bind(this));
	
};

logic.terrainPalette.reloadTextures = function() {
	console.log(mods[this.currentMod]);
};

/******************************************************************************
 ******************************************************************************
 **	Functions
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 **	Height
 ******************************************************************************/

logic.terrainPalette.heightToggle = function(e) {
	
	//Enable/disable transformer
	this.setTransformer('height', document.terrain.taHeight.checked);
	
};

//Radio buttons
logic.terrainPalette.heightRadioChanged = function(e) {
	
	//Update direction
	if (e.target.id == "taHeightLower")
		this.setTransformerHeightDirection(-1);
	else if (e.target.id == "taHeightRaise")
		this.setTransformerHeightDirection(1);
	
	//Update UI & enabled transformer
	document.terrain.taHeight.checked = true;
	this.setTransformer('height', true);
	
};

/******************************************************************************
 **	Brush
 ******************************************************************************/

//Size
logic.terrainPalette.sizeChange = function(e) {
	
	//Grab the new value
	var newValue = Math.round(Math.pow(document.terrain.tbSizeIn.value, 2));
	
	//Update UI & transformer
	document.terrain.tbSizeOut.value = newValue;
	this.setBrushSize(newValue);
	
};
 
//Strength
logic.terrainPalette.strengthChange = function(e) {
	
	//Grab the new value
	var newValue = Math.round(Math.pow(document.terrain.tbStrengthIn.value, 2));
	
	//Update UI & transformer
	document.terrain.tbStrengthOut.value = newValue;
	this.setBrushStrength(newValue);
	
};

