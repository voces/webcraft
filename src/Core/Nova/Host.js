//Requires jQuery

//***************************************
//**	Constructor
//***************************************

Nova.Host = function(ip, port) {
	
	this.ip = ip;
	this.port = port;
	
	if (this.ip && this.port)
		this.loadSocket();
};

Nova.Host.prototype.connect = function(ip, port) {
	
	if (!this.connected(ip, port)) {
		
		this.destroy();
		
		this.ip = ip;
		this.port = port;
		
		this.loadSocket();
	}
	
};

//***************************************
//**	Joining/Leaving
//***************************************

Nova.Host.prototype.sendKey = function(key) {
	this.send({id: 'key', key: key});
};

Nova.Host.prototype.lobby = function(lobby) {
	this.send({id: 'lobby', name: lobby});
};

Nova.Host.prototype.leave = function() {
	this.send({id: 'leave'});
};

//***************************************
//**	Control
//***************************************

Nova.Host.prototype.unlist = function(lobby) {
	this.send({id: 'unlist', name: lobby});
};

Nova.Host.prototype.relist = function(lobby) {
	this.send({id: 'relist', name: lobby});
};

Nova.Host.prototype.unreserve = function(lobby) {
	this.send({id: 'unreserve', name: lobby});
};

//***************************************
//**	Protocols
//***************************************

Nova.Host.prototype.protocol = function(protocol) {
	this.send({id: 'protocol', path: protocol});
};

Nova.Host.prototype.getProtocols = function() {
	this.send({id: 'getProtocols'});
};

//***************************************
//**	Misc
//***************************************

Nova.Host.prototype.broadcast = function(data) {
	if (typeof data == "undefined") data = {id:"broadcast"};
	else if (typeof data == "object") data.id = "broadcast";
	else data = {id:"broadcast", data: data};
	
	this.send(data);
};

//A simplification of .socket.send
Nova.Host.prototype.send = function(data) {
	if (this.socket.readyState != 1) return;
	
	if (this.nova.debugging) console.log('tH', data);
	
	data = JSON.stringify(data);
	this.socket.send(data);
};

Nova.Host.prototype.connected = function(ip, port) {
	return this.ip == ip && this.port == port && this.socket.readyState == 1;
};

//***************************************
//**	Socket
//***************************************

Nova.Host.prototype.loadSocket = function() {
	
	//Create the socket
	this.socket = new WebSocket('ws://' + this.ip + ':' + this.port);
	
	//Attach events
	this.socket.onmessage = this._onmessage.bind(this);
	this.socket.onopen = this._onopen.bind(this);
	this.socket.onclose = this._onclose.bind(this);
	this.socket.onerror = this._onerror.bind(this);
}

//When a message is received from the server
//evt.data is the plain text
Nova.Host.prototype._onmessage = function(evt) {
	try {
		var packet = jQuery.parseJSON(String(evt.data));
		if (this.nova.debugging) console.log('rH', packet);
	} catch (err) {
		if (this.nova.debugging) console.error(err, String(evt.data));
		$(this).trigger('onError', String(evt.data));
	}
	
	if (packet) $(this).trigger(packet.id, [packet]);
};

//On first open
Nova.Host.prototype._onopen = function(evt) {
	$(this).trigger("onOpen", [evt]);
};

//When the connection is closed
Nova.Host.prototype._onclose = function(evt) {
	$(this).trigger("onClose", [evt]);
};

//When the connect has an error
Nova.Host.prototype._onerror = function(evt) {
	$(this).trigger("onError", [evt]);
};

//Closes the socket
Nova.Host.prototype.close = function() {
	if (typeof this.socket != "undefined")
		this.socket.close();
};

//***************************************
//**	Destructor
//***************************************

Nova.Host.prototype.destroy = function() {
	
	if (this.socket) {
		
		this.socket.close();
		
		//Detach events
		this.socket.onmessage = null;
		this.socket.onopen = null;
		this.socket.onclose = null;
		this.socket.onerror = null;
	}
}
