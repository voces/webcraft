
importScripts('/os/bcrypt.js');

WebSocket.LOGGED = 5;

var bcrypt = new bCrypt();

var credentials = {
	user: null,
	pass: null
}

/******************************************************************************
 ******************************************************************************
 *	Port
 ******************************************************************************
 ******************************************************************************/

var ports = [];

/******************************************************************************
 *	Individual
 ******************************************************************************/

//A port connected, add to list and bind message handler
onconnect = function(e) {
	
	var port = e.ports[0];
	ports.push(port);
	
	port.onmessage = onMessage;
	
}

/******************************************************************************
 *	Joint
 ******************************************************************************/

//Send a message to all ports
function sendAll(what) {
	for (var i = 0; i < ports.length; i++)
		ports[i].postMessage(what);
}

//Received a message from a port
function onMessage(e) {
	
	switch (e.data.id) {
		
		case 'status':
			e.target.postMessage({which: 'status', value: status});
			break;
			
		case 'login':
			bcrypt.hashpw(e.data.password + 'nova10262013', '$2a$10$Nov4t3n7weNTeE51KstHu4', function(hash) {
				credentials.user = e.data.user;
				credentials.pass = hash;
				
				socket.send(JSON.stringify({id: 'login', account: credentials.user, password: credentials.pass}));
			});
			break;
		
		case 'saveMod':
			ssend(e.data);
			break;
			
		case 'modList':
			socket.send(JSON.stringify({id: 'modList', filter: e.data.filter}));
			break;
			
		default:
			e.target.postMessage({which: 'unknown'});
	}
}

/******************************************************************************
 ******************************************************************************
 *	WebSocket
 ******************************************************************************
 ******************************************************************************/

var socket;
var status = -1;

function ssend(obj) {
	
	console.log(obj);
	
	if (typeof obj != 'string')
		obj = JSON.stringify(obj);
	
	socket.send(obj);
}

//Occurs when a connection successfully opens with Nova
function onopen(e) {
	
	//Tell ports
	status = WebSocket.OPEN;
	sendAll({id: 'local', sid: 'status', status: WebSocket.OPEN})
	
	//Reconnect if we have credentials
	if (credentials.user != null)
		socket.send(JSON.stringify({id: 'login', account: credentials.user, password: credentials.pass}));
	
}

//Handle messages from Nova
function onmessage(e) {
	
	//Parse the packet
	var packet = JSON.parse(e.data);
	
	switch (packet.id) {
		
		case 'onLogin':
			status = WebSocket.LOGGED;
			sendAll({id: 'local', sid: 'status', status: WebSocket.LOGGED});
			break;
		
	}
	
	//Send the packet to all ports
	sendAll(packet);
	
}

//Errors in the socket connection, this should basically never happen, so we don't do anything
function onerror(e) {
	console.error(e);
}

//The socket closed with Nova (generally Nova closed it)
function onclose(e) {
	
	//Tell ports
	status = WebSocket.CLOSED;
	sendAll({id: 'local', sid: 'status', status: WebSocket.CLOSED})
	
	//Reconnect
	loadSocket();
	
}

//Function to connect to Nova and attach handlers
function loadSocket() {
	
	status = WebSocket.CONNECTING;
	sendAll({id: 'local', sid: 'status', status: WebSocket.CONNECTING})
	
	//Create the socket
	try {
		socket = new WebSocket('wss://notextures.io:8082');
	} catch (err) {
		//ignore failed connection attempt
	}
	
	//Attach events
	socket.onopen = onopen;
	socket.onmessage = onmessage;
	socket.onclose = onclose;
	socket.onerror = onerror;
	
}

//Connect
loadSocket();
