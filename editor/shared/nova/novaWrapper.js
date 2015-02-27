
(function(logic) {

//Create our worker
var worker = new SharedWorker('shared/nova/novaWorker.js');

//Port for easy access, and start
var port = worker.port;
port.start();

var status;

/******************************************************************************
 ******************************************************************************
 **	Updates
 ******************************************************************************
 ******************************************************************************/

function handleLocal(packet) {
	
	switch (packet.sid) {
		case 'status': status = packet.status; break;
		default: throw("local packet: '" + packet.sid + "'");
	}
	
}

port.addEventListener('message', onMessage);
function onMessage(e) {
	
	var packet = e.data;
	
	switch (packet.id) {
		case 'local': handleLocal(packet); break;
		case 'onLogin': break;
		case 'onModList': break;
		default: console.error(packet);
	}
	
}

/******************************************************************************
 ******************************************************************************
 **	Loader
 ******************************************************************************
 ******************************************************************************/

function init() {
	
	
	
}

/******************************************************************************
 ******************************************************************************
 *	Export
 ******************************************************************************
 ******************************************************************************/

//Calls our init when the page loads
logic.initializers.push(init);

logic.nova = {
	
	get status() {
		return status;
	},
	
	login: function(user, password, outerCallback) {
		
		if (typeof user != 'string' || user.length == 0 || typeof password != 'string' || password.length == 0)
			return;
		
		function innerCallback(e) {
			if (['onLogin', 'onLoginFail'].indexOf(e.data.id) == -1) return;
			port.removeEventListener('message', innerCallback);
			if (outerCallback) outerCallback(e.data);
		}
		
		port.addEventListener('message', innerCallback);
		port.postMessage({id: 'login', user: user, password: password});
	},
	
	saveMod: function(meta, file) {
		
		port.postMessage({id: 'saveMod', meta: meta, mod: file});
		
	},
	
	modList: function(filter, outerCallback) {
		
		function innerCallback(e) {
			if (['onModList'].indexOf(e.data.id) == -1) return;
			port.removeEventListener('message', innerCallback);
			if (outerCallback) outerCallback(e.data);
		}
		
		port.addEventListener('message', innerCallback);
		port.postMessage({id: 'modList', filter: filter});
	}
};

})(logic);
