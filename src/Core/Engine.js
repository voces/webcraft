Engine = function(core) {
	
	this.core = core;
	
	this.protocol = null;
	this.sandbox = null;
	this.players = [];
	
	this.$ = $(this);
	
	this.account = "";
	
	$(document).ready(this.ready.bind(this));
};

/**********************************
**	Server Communication Hooks
**********************************/

Engine.prototype.onLogin = function(e2, e) {
	console.log("onLogin", this, e);
	
	this.account = e.account;
};

/**********************************
**	Host Communication Hooks
**********************************/

Engine.prototype.onJoin = function(e2, e) {
	
	if (e.accounts.indexOf(this.account) >= 0) {
		console.log("onJoin", "a");
		this.players = e.accounts;
	} else {
		console.log("onJoin", "b");
		this.players.concat(e.accounts);
	}
	
	//Give to sandbox
	if (this.sandbox)
		this.sandbox.postMessage({type: "host", data: e});
};

Engine.prototype.onBroadcast = function(e2, e) {
	
	if (e.accounts.indexOf(this.account) >= 0) {
		console.log("onJoin", "a");
		this.players = e.accounts;
	} else {
		console.log("onJoin", "b");
		this.players.concat(e.accounts);
	}
	
	//Give to sandbox
	if (this.sandbox)
		this.sandbox.postMessage({type: "host", data: e});
};

/**********************************
***********************************
**	Sandboxing
***********************************
**********************************/

Engine.prototype.onMessage = function(e) {
	console.log("onMessage", e);
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
	
	//Build our sandbox, should update this to grab the script and transform it into a Blob
	this.sandbox = new Worker(this.protocol.script);
	this.sandbox.addEventListener("message", this.onMessage);
	
	//Emit starter info
	this.sandbox.postMessage({
		type: "init",
		players: this.players,
		localPlayer: this.account
	});
	
	//And tell everyone we've loaded
	this.$.trigger("onLoad", []);
};

//When the document is ready, let's add some hooks
Engine.prototype.ready = function() {
	
	//Our superobjects
	this.nova = core.nova;
	this.host = core.host;
	
	//Nova events
	$(this.nova).on("onLogin", this.onLogin.bind(this));
	
	//Host events
	$(this.host).on("onJoin", this.onJoin.bind(this));
	$(this.host).on("onBroadcast", this.onBroadcast.bind(this));
};
