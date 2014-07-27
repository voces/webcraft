Engine = function(core) {
	
	this.core = core;
	
	this.natives = new Engine.Natives(this);
	
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
	this.account = e.account;
};

/**********************************
**	Host Communication Hooks
**********************************/

Engine.prototype.onJoin = function(e2, e) {
	
	if (e.accounts.indexOf(this.account) >= 0)
		this.players = e.accounts;
	else
		this.players.concat(e.accounts);
	
	//Give to sandbox
	if (this.sandbox)
		this.sandbox.postMessage({type: "host", data: e});
};

Engine.prototype.onBroadcast = function(e2, e) {
	
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
	}) + ";\n" + this.protocol.script;
	
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
	$(this.host).on("onJoin", this.onJoin.bind(this));
	$(this.host).on("onBroadcast", this.onBroadcast.bind(this));
};
