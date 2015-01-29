
(function(logic) {

/******************************************************************************
 ******************************************************************************
 **	Init
 ******************************************************************************
 ******************************************************************************/

//Called when the page loads (DOM ready, general objects created)
function init() {
	
	//For easy access
	var terrain = document.terrain;
	
	/****************************************************************************
	 **	Brush
	 ****************************************************************************/
	
	//Size
	terrain.tbSizeIn.addEventListener('input', sizeChange);
	
	//Strength
	terrain.tbStrengthIn.addEventListener('input', strengthChange);
	
	/****************************************************************************
	 **	Texture
	 ****************************************************************************/
	
	terrain.taTex.addEventListener('click', textureApplyChange);
	
	/****************************************************************************
	 **	Height
	 ****************************************************************************/
	
	//Apply
	terrain.taHeight.addEventListener('click', heightApplyChange);
	
	//Radios
	var radios = terrain.heightRadios;
	for (var i = 0, radio; radio = radios[i]; i++)
		radio.addEventListener('click', heightRadioChanged);
	
}

/******************************************************************************
 ******************************************************************************
 *	Events
 ******************************************************************************
 ******************************************************************************/

/******************************************************************************
 **	Brush
 ******************************************************************************/

//Size
function sizeChange(e) {
	
	//Grab the new value
	var newValue = Math.round(Math.pow(document.terrain.tbSizeIn.value, 2));
	
	//Update UI & transformer
	document.terrain.tbSizeOut.value = newValue;
	logic.setBrushSize(newValue);
	
};
 
//Strength
function strengthChange(e) {
	
	//Grab the new value
	var newValue = Math.round(Math.pow(document.terrain.tbStrengthIn.value, 2));
	
	//Update UI & transformer
	document.terrain.tbStrengthOut.value = newValue;
	logic.setBrushStrength(newValue);
	
};

/******************************************************************************
 **	Texture
 ******************************************************************************/

//Enables or disables the texture transformer
function textureApplyChange(e) {
	logic.setTransformer('texture', terrain.taTex.checked);
}

function textureRadioChanged(e) {
	
	//Get the value
	var index = Number(e.target.getAttribute('for').match(/\d+/)[0])+1;
	
	//Update the texture index
	logic.setTransformerTexture(index);
	
	//Enable & update UI
	document.terrain.taTex.checked = true;
	logic.setTransformer('texture', true);
	
}

/******************************************************************************
 **	Height
 ******************************************************************************/

//Enables or disables the height transformer
function heightApplyChange(e) {
	logic.setTransformer('height', terrain.taHeight.checked);
}

//Radio buttons
function heightRadioChanged(e) {
	
	//Update direction
	if (e.target.id == "taHeightLower")
		logic.setTransformerHeightDirection(-1);
	else if (e.target.id == "taHeightRaise")
		logic.setTransformerHeightDirection(1);
	
	//Update UI & enabled transformer
	document.terrain.taHeight.checked = true;
	logic.setTransformer('height', true);
	
};

/******************************************************************************
 ******************************************************************************
 *	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

//Takes in an array of the tileTextures array
logic.loadPaletteTextures = function(tileTextures) {
	
	//Quit if textures isn't an object (should be an array, but it's defined in
	//		Mod, so we can't instance type)
	if (typeof tileTextures !== 'object') return;
	
	//Grab the previous inputs and their labels
	var prevTextures = document.terrain.texture
			.querySelectorAll('input[type=radio], input[type=radio] + label');
	
	//Remove them
	for (var i = 0; i < prevTextures; i++)
		prevTextures[i].remove();
	
	//Add all our textures (start at 1 to skip the info one)
	for (var i = 1, tT, input, label; tT = tileTextures[i]; i++) {
		
		//Build our input (will be hidden)
		input = document.createElement('input');
		input.id = 'taTex' + (i-1);
		input.type = 'radio';
		input.name = 'textureRadios';
		
		//Build our label (contains the image)
		label = document.createElement('label');
		label.setAttribute('for', 'taTex' + (i-1));
		label.classList.add('img');
		label.style.background = 'url(' + tT[0] + ')';
		label.style.backgroundSize = tT[1] * 100 + '%';
		label.addEventListener('click', textureRadioChanged);
		
		//Add them
		document.terrain.texture.appendChild(input);
		document.terrain.texture.appendChild(label);
		
	}
	
}

})(logic);
