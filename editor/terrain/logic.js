
var mods = window.opener ?
		window.opener.mods || new Emitter([]) :
		new Emitter([]);

var logic = {
	
	graphic: null,
	
	//Objects we need
	keys: [],
	mouse: new THREE.Vector2(),
	mouseRaw: new THREE.Vector2(),
	raycaster: new THREE.Raycaster(),
	plane: null,
	
	activeTileMap: {},
	
	//Integer value of the currently loaded mod
	currentMod: null,
	
	//UI
	modCaret: null,
	modList: null,
	openMethod: null,
	saveMethod: null,
	
	windowActive: true,
	
	settings: {
		showPathingMap: false,
		transformations: [
		]
	},
	
	/****************************************************************************
	 *	Transformers
	 ****************************************************************************/
	
	transformers: {
		brush: {
			size: 1,
			type: 'circle'
		},
		list: [
			{
				which: 'height',
				enabled: false,
				active: false,
				strength: 8,
				func: null
			}
		]
	},
	
	/****************************************************************************
	 *	Build any keys we might want
	 ****************************************************************************/
	
	currentCamera: 'world',
	
	//Default linear methods (we scroll the camera until key up)
	panLRKey: new Key({property: 'x'}),
	panUDKey: new Key({property: 'y'}),
	
	//Approaches, handle detaching themselves
	angleKey: new Key({
		property: 'x',
		method: 'approach',
		minRate: .01,
		rate: 0.01,
		target: Math.PI * 17/90
	}),
	zoomKey: new Key({
		property: 'z',
		method: 'approach',
		minRate: 1,
		target: 1792
	}),
	
	/****************************************************************************
	 ****************************************************************************
	 *	Init
	 ****************************************************************************
	 ****************************************************************************/
	
	init: function() {
		
		/**************************************************************************
		 **	terrainPalette
		 **************************************************************************/
		
		this.initTerrainPalette();
		
		/**************************************************************************
		 **	UI stuff
		 **************************************************************************/
		
		this.modCaret = document.getElementById('mod').children[0].children[0];
		this.modList = document.getElementById('mod').children[1];
		
		this.openMethod = document.getElementById('open').children[0].firstChild;
		this.saveMethod = document.getElementById('save').children[0].firstChild;
		
		/**************************************************************************
		 **	Build our graphics and attach graphic-related values
		 **************************************************************************/
		
		//The object
		this.graphic = new Graphic(document.getElementById('world'));
		
		//Related keys
		this.panLRKey.obj = this.graphic.camera.position;
		this.panUDKey.obj = this.graphic.camera.position;
		this.angleKey.obj = this.graphic.camera.rotation;
		this.zoomKey.obj = this.graphic.camera.position;
		
		/**************************************************************************
		 **	Events
		 **************************************************************************/
		
		//Keys
		window.addEventListener('keydown', this.onKeyDown.bind(this));
		window.addEventListener('keyup', this.onKeyUp.bind(this));
		
		//Mouse
		window.addEventListener('wheel', this.onScroll.bind(this));
		window.addEventListener('mousemove', this.onMouseMove.bind(this));
		window.addEventListener('click', this.onClick.bind(this));
		
		window.addEventListener('mousedown', this.onMouseDown.bind(this));
		window.addEventListener('mouseup', this.onMouseUp.bind(this));
		
		//Menu
		document.getElementById('menu')
				.addEventListener('click', this.menuSwitch.bind(this));
		
		//Mods (other windows)
		mods.on("push", this.newMod.bind(this));
		mods.on("close", this.closeMod.bind(this));
		mods.on("savedStateChange", this.onSavedStateChange.bind(this));
		
		//Window
		window.addEventListener('focus', this.windowFocus.bind(this));
		window.addEventListener('blur', this.windowBlur.bind(this));
		
    /**************************************************************************
		 **	Load our mods
		 **************************************************************************/
    
    for (var i = 0, mod; mod = mods[i]; i++)
			this.newMod({detail: {mod: mod}}, i);
		
		/**************************************************************************
		 **	Initial mod
		 **************************************************************************/
		
		if (mods.length != 0) return;
		
		//Create the mod
		var mod = new Mod({
			title: 'Untitled',
			author: 'Unknown',
			geoType: 'flat',
			height: 10,
			width: 15
		});
		var id = mods.push(mod) - 1;
		
		//Build an event
		mods.emit('push', new CustomEvent('push', {
			detail: {mod: mod, id: id}
		}));
		
    var box = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshPhongMaterial());
    box.castShadow = true;
    box.position.z = 192;
    this.graphic.scene.add(box);
    
		this.point = new Point(8, 0xffffff);
		this.graphic.scene.add(this.point);
		
		/**************************************************************************
		 **	Contained UI (things to short to warrant functions)
		 **************************************************************************/
		
		var rangeInputs = document.querySelectorAll('#right .range > input');
		var rangeOutputs = document.querySelectorAll('#right .range > output');
		
		for (var i = 0; i < rangeInputs.length; i++) {
			rangeInputs[i].output = rangeOutputs[i];
			rangeInputs[i].addEventListener('input', function(e) {
				
				var value = Math.floor(e.target.value);
				
				sign = typeof value === 'number' ? value ? value < 0 ? -1 : 1 : value
						=== value ? 0 : NaN : NaN;
				
				e.target.output.value = sign * Math.round(Math.pow(value, 2));
			}.bind(this));
		}
		
	}
};
