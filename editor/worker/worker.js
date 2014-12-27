
importScripts('emitter.js', 'mod.js');

worker = {};

/***********************************
**	Messaging
************************************/

worker.incoming = new Emitter();

worker.incoming.on('newMod', function(e) {
	var mod = new Mod(e.data.data);
	var id = worker.mods.push(mod) - 1;
	
	//Send to all
	worker.postMessage({id: 'newMod', which: id, path: mod.path()});
});

worker.incoming.on('request', function(e) {
	
	console.log(e);
	
	
	
	//Terrain related
	if (e.data.major == 'terrain') {
		
		//We'd only ever request terrain data from one map at a time, so reject
		//	invalids
		if (e.data.which < 0 || e.data.which >= worker.mods.length) return;
		
		//Minor is blank, assume all
		if (typeof e.data.minor == "undefined") {
			e.port.postMessage({
				id: 'onRequest',
				which: e.data.which,
				major: 'terrain',
				terrain: worker.mods[e.data.which].terrain
			});
		}
	
	//Code related
	} else if (e.data.major == 'code') {
		
		var code, specified = false;
		
		//They requested for a single mod
		if (typeof e.data.which != "undefined") {
			
			//Quit if specified invalid mod
			if (e.data.which < 0 || e.data.which >= worker.mods.length) return;
			
			specified = true;
			
		//Get every mod's code
		} else {
			
			list = [];
			for (var i = 0; i < worker.mods.length; i++)
				list[i] = {
					id: i,
					path: worker.mods[i].path(),
					code: worker.mods[i].code
				};
			
			console.log(list);
		}
		
		//Build response object
		var response = {
			id: 'onRequest',
			major: 'code'
		};
		
		//If we are grabbing only one mod's code, provide a which value
		if (specified) {
			response.which = e.data.which;
			response.path = worker.mods[e.data.which].path();
			response.code = worker.mods[e.data.which].code;
		} else {
			response.list = list;
		}
		
		//And send
		e.port.postMessage(response);
		
	}
});

/***********************************
**	Mods
************************************/

worker.mods = [];

/***********************************
**	Ports
************************************/

//Global port list
worker.ports = [];

//Called when any port sends us something
worker.onMessage = function(e) {
	
	console.log('r', e.data);
	
	if (typeof e.data.id != "undefined")
		worker.incoming.emit(e.data.id, e);
};

//Called when a tab connects to the shared worker
worker.onConnect = function(e) {
	
	//Our global port list (one for each tab)
	worker.ports.push(e.ports[0]);
	
	//Set a local port for easy use
	var port = e.ports[0];
	port.id = worker.ports.length - 1;
	
	//Listeners for the port
	port.addEventListener("message", function(e) {
		e.port = port;
		worker.onMessage(e);
	}, false);
	
	//We're ready, let's go
	port.start();
	
	//ID is not needed, as it is known by the array index
	var mods = [];
	for (var i = 0; i < worker.mods.length; i++)
		mods.push(worker.mods[i].path());
	
	port.postMessage({id: "connect", mods: mods});
};

//Add a listener for all port connections
self.addEventListener("connect", worker.onConnect, false);

worker.postMessage = function(what) {
	for (var i = 0; i < worker.ports.length; i++)
		worker.ports[i].postMessage(what);
}
