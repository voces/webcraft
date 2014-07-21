//Requires jQuery

//***************************************
//**	Constructor
//***************************************

Nova = function(address, debug) {
	
	//Should add a queue system for when disconnected
	
	//Variables
	this.address = address || 'ws://68.229.21.36:8082';
	this.debugging = debug || false;
	
	//Load the socket up
	//this.loadSocket();
	
};

//***************************************
//***************************************
//**	Methods
//***************************************
//***************************************

//A simplification of .socket.send
Nova.prototype.send = function(what) {
	if (this.socket.readyState != 1) return;
	
	if (this.debugging) console.log("tS", what);
	
	what = JSON.stringify(what);
	this.socket.send(what);
};

Nova.prototype.connected = function() {
	
	if (typeof this.socket == "undefined" || this.socket.readyState !== 1) return false;
	else return true;
};

//***************************************
//**	Account
//***************************************

Nova.prototype.login = function(account, password) {
	this.send({id:"login", account:account, password:password});
};

Nova.prototype.logout = function() {
	this.send({id:"logout"});
};

Nova.prototype.register = function(account, password, email) {
	if (typeof email == "undefined") email = null;
	
	this.send({id:"register", account:account, password:password, email:email});
};

//***************************************
//**	Misc
//***************************************

Nova.prototype.debug = function(bool) {
	this.debugging = bool;
};

Nova.prototype.whisper = function(account, message) {
	if (account && message)
		this.send({id:"whisper", account:account, message:message});
};

Nova.prototype.echo = function(data) {
	if (typeof data == "undefined") data = {id:"echo"};
	else if (typeof data == "object") data.id = "echo";
	else data = {id:"echo", data: data}
	
	this.send(data);
};

Nova.prototype.broadcast = function(data) {
	if (typeof data == "undefined") data = {id:"broadcast"};
	else if (typeof data == "object") data.id = "broadcast";
	else data = {id:"broadcast", data: data};
	
	this.send(data);
};

Nova.prototype.js = function(data) {
	if (typeof data == "undefined") data = {id:"js"};
	else if (typeof data == "object") data.id = "js";
	else data = {id:"js", data: data};
	
	this.send(data);
};

//***************************************
//**	Friends
//**************************************

Nova.prototype.friendAdd = function(account) {
	this.send({id:"friendAdd", account:account});
};

Nova.prototype.friendRemove = function(account) {
	this.send({id:"friendRemove", account:account});
};

Nova.prototype.friendList = function(tag) {
	this.send({id: "friendList", tag: tag});
};

//***************************************
//**	Groups
//***************************************

Nova.prototype.join = function(group) {
	if (typeof group != 'undefined')
		this.send({id:"join", group:group});
};

Nova.prototype.noGroup = function() {
	this.send({id:"noGroup"});
};

//***************************************
//**	Hosting
//***************************************

Nova.prototype.reserve = function(host, name) {
	this.send({id: 'reserve', host: host, name: name});
};

Nova.prototype.bridge = function(host) {
	this.send({id: 'bridge', host: host});
};

Nova.prototype.lobbyList = function() {
	this.send({id: 'lobbyList'});
};

Nova.prototype.hostList = function() {
	this.send({id: 'hostList'});
};

//***************************************
//***************************************
//**	Websocket
//***************************************
//***************************************

Nova.prototype.loadSocket = function(address) {
	
	if (address != null) this.address = address;
	
	//Create the socket
	this.socket = new WebSocket(this.address);
	
	//Attach events
	this.socket.onmessage = this._onmessage.bind(this);
	this.socket.onopen = this._onopen.bind(this);
	this.socket.onclose = this._onclose.bind(this);
	this.socket.onerror = this._onerror.bind(this);
}

//When a message is received from the server
//evt.data is the plain text
Nova.prototype._onmessage = function(evt) {
	try {
		var packet = jQuery.parseJSON(String(evt.data));
		if (this.debugging) console.log("rS", packet);
	} catch (err) {
		if (this.debugging) console.error(err, String(evt.data));
		$(this).trigger('onError', String(evt.data));
	}
	
	if (packet) $(this).trigger(packet.id, [packet]);
};

//On first open
Nova.prototype._onopen = function(evt) {
	$(this).trigger("onOpen", [evt]);
};

//When the connection is closed
Nova.prototype._onclose = function(evt) {
	this.loadSocket();
	
	$(this).trigger("onClose", [evt]);
};

Nova.prototype._onerror = function(evt) {
	$(this).trigger("onError", [evt]);
};

//***************************************
//***************************************
//**	Host
//***************************************
//***************************************

Nova.prototype.newHost = function(ip, port) {
	var host = new Nova.Host(ip, port);
	
	host.nova = this;
	
	return host;
};
