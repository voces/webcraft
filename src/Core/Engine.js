Engine = function(core) {
	
	this.core = core;
	
	this.natives = new Engine.Natives(this);
	
	this.protocol = null;
	this.sandbox = null;
	this.players = [];
	this.widgets = [];
	
	this.pinger = null;
	this.pings = [];	//Round trip time
	this.clocks = [];	//Difference from timestamp and received
	this.clockOffset = 0;
	
	this.$ = $(this);
	
	this.account = "";
	
	$(document).ready(this.ready.bind(this));
};

/**********************************
**	Server Hooks
**********************************/

Engine.prototype.onLogin = function(e2, e) {
	this.account = e.account;
};

/**********************************
**	Host Hooks
**********************************/

Engine.prototype.onOpen = function(e2, e) {
	this.pings = [];
	this.clocks = [];
	
	this.ping();
};

Engine.prototype.onJoin = function(e2, e) {
	
	if (e.accounts.indexOf(this.account) >= 0)
		this.players = e.accounts;
	else
		this.players.concat(e.accounts);
	
	//Give to sandbox
	if (this.sandbox) {
		e.timestamp = e.timestamp + this.clockOffset;
		this.sandbox.postMessage({type: "host", data: e});
	}
};

Engine.prototype.onBroadcast = function(e2, e) {
	
	//Give to sandbox
	if (this.sandbox) {
		e.timestamp = e.timestamp + this.clockOffset;
		
		this.sandbox.postMessage({type: "host", data: e});
	}
};

/**********************************
**	UI Hooks
**********************************/

//Attached in Game.js
Engine.prototype.keydown = function(e) {
	this.sandbox.postMessage({
		type: "ui",
		data: {
			id: "keydown",
			which: e.which,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			metaKey: e.metaKey,
			shiftKey: e.shiftKey,
			timeStamp: e.timeStamp
		}
	});
};

Engine.prototype.keyup = function(e) {
	this.sandbox.postMessage({
		type: "ui",
		data: {
			id: "keyup",
			which: e.which,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			metaKey: e.metaKey,
			shiftKey: e.shiftKey,
			timeStamp: e.timeStamp
		}
	});
};

/**********************************
**	Pinging
**********************************/

Engine.prototype.ping = function() {
	this.host.echo({sid: "ping", sent: Date.now()});
};

Engine.prototype.onEcho = function(e2, e) {
	if (e.sid == "ping") {
		this.pings.push(Date.now() - e.sent);
		this.clocks.push(Date.now() - e.timestamp);
		
		if (this.clocks.length == 1)
			this.clockOffset = this.clocks[0];
	}
};

Engine.prototype.getPing = function(e2, e) {
	
	var sum = 0;
	var n;
	
	for (var i = this.pings.length - 1, n = 0; i >= 0 && n < 5; i--, n++)
		sum += this.pings[i];
	
	return sum / n;
};

Engine.prototype.getClock = function(e2, e) {
	
	var sum = 0;
	var n;
	
	for (var i = this.clocks.length - 1, n = 0; i >= 0 && n < 5; i--, n++)
		sum += this.clocks[i];
	
	return sum / n;
};

/**********************************
***********************************
**	Sandboxing
***********************************
**********************************/

Engine.prototype.onMessage = function(e) {
	
	if (typeof this.natives[e.data._func] == "function")
		this.natives[e.data._func](e.data);
	else
		console.error("Unknown native function " + e.data._func);
};

/**********************************
***********************************
**	(re)Loading
***********************************
**********************************/

Engine.prototype.clear = function() {
	this.protocol = null;
	
	if (this.sandbox != null) {
		this.sandbox.terminate();
		this.sandbox = null;
	}
	
	//Eventually the entire scene should be cleared, but I don't want to abstract the cameras and lights ATM
	for (var i = 6; i < this.graphic.scene.children.length; i++)
		this.graphic.scene.remove(this.graphic.scene.children[i]);
};

//Loads a protocol
Engine.prototype.load = function(protocol) {
	
	if (this.protocol != null)
		this.clear();
	
	this.protocol = protocol;
	
	//Protocol is empty, don't try to load anything; just trigger
	if (this.protocol == null) {
		this.$.trigger("onLoad", []);
		return;
	}
	
	//Build a JS blob from the script
	this.protocol.script = "_initData = " + JSON.stringify({
		type: "init",
		url: window.location.href,
		players: this.players,
		localPlayer: this.account
	}) + ";" + this.protocol.script;
	
	var blob;
	try {
		blob = new Blob([this.protocol.script], {type: "application/javascript"});
	} catch (e) {
		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
		blob = new BlobBuilder();
		blob.append(this.protocol.script);
		blob = blob.getBlob();
	}
	
	//Launch the worker
	var URL = window.URL || window.webkitURL;
	this.sandbox = new Worker(URL.createObjectURL(blob));
	this.sandbox.addEventListener("message", this.onMessage.bind(this));
	
	//And tell everyone we've loaded
	this.$.trigger("onLoad", []);
};

//When the document is ready, let's add some hooks
Engine.prototype.ready = function() {
	
	//Our superobjects
	this.nova = core.nova;
	this.host = core.host;
	this.graphic = core.graphic;
	
	//Nova events
	$(this.nova).on("onLogin", this.onLogin.bind(this));
	
	//Host events
	$(this.host).on("onOpen", this.onOpen.bind(this));
	$(this.host).on("onJoin", this.onJoin.bind(this));
	$(this.host).on("onBroadcast", this.onBroadcast.bind(this));
	$(this.host).on("onEcho.Game", this.onEcho.bind(this));
	
	//Other
	this.pinger = setInterval(this.ping.bind(this), 1000);
};
