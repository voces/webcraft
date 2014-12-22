
importScripts('emitter.js', 'mod.js');

worker = {};

/***********************************
**	Messaging
************************************/

worker.incoming = new Emitter();

worker.incoming.on('newMod', function(e) {
	var mod = new Mod(e.data.data);
	worker.mods.push(mod);
	
	//Send to all
	worker.postMessage({id: 'newMod', path: mod.path()});
});

worker.incoming.on('request', function(e) {
	
	console.log(e);
	
	//Simply quit if invalid
	if (e.data.which < 0 || e.data.which >= worker.mods.length) return;
	
	//Terrain related
	if (e.data.major == 'terrain') {
		
		//Minor is blank, assume all
		if (typeof e.data.minor == "undefined") {
			e.port.postMessage({
				id: 'onRequest',
				major: 'terrain',
				terrain: worker.mods[e.data.which].terrain
			});
		}
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
	
	port.postMessage({id: "connect"});
};

//Add a listener for all port connections
self.addEventListener("connect", worker.onConnect, false);

worker.postMessage = function(what) {
	for (var i = 0; i < worker.ports.length; i++)
		worker.ports[i].postMessage(what);
}
