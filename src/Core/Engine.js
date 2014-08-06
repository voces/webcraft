Engine = function(core) {
	
	this.core = core;
	
	this.natives = new Engine.Natives(this);
	
	this.protocol = null;
	this.sandbox = null;
	this.players = [];
	this.widgets = [];
	
	this.css;
	this.elements = [];
	
	this.pinger = null;
	this.pings = [];	//Round trip time
	this.clocks = [];	//Difference from now and received, basically is latency + real clock difference
	this.offset = 0;	//This should NOT arbitrarily change value, as things can get desynced
	
	this.$ = $(this);
	
	this.account = "";
	
	$(document).ready(this.ready.bind(this));
};

/**********************************
***********************************
**	Hooks
***********************************
**********************************/

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
		this.players = this.players.concat(e.accounts);
	
	//Give to sandbox
	if (this.sandbox) {
		e.timestamp = e.timestamp + this.offset;
		this.sandbox.postMessage({type: "host", data: e});
	}
};

Engine.prototype.onLeave = function(e2, e) {
	
	//We left
	if (e.account == this.account) {
		this.clear();
		this.players = [];
		
		return;
	}
	
	var index = this.players.indexOf(e.account);
	if (index >= 0) this.players.splice(index, 1);
	
	//Give to sandbox
	if (this.sandbox) {
		e.timestamp = e.timestamp + this.offset;
		this.sandbox.postMessage({type: "host", data: e});
	}
};

Engine.prototype.onBroadcast = function(e2, e) {
	
	//Give to sandbox
	if (this.sandbox) {
		e.timestamp = e.timestamp + this.offset;
		
		this.sandbox.postMessage({type: "host", data: e});
	}
};

/**********************************
**	UI Hooks
**********************************/

//Attached in Game.js
Engine.prototype.keydown = function(e) {
	this.sandbox.postMessage({
		type: "local",
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
		type: "local",
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
			this.offset = this.clocks[0];
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
**	Functionality
***********************************
**********************************/

Engine.prototype.addElement = function(data, parent) {
	switch (data.tag) {
	case "style":
		
		if (typeof this.css == "undefined") this.css = $("<style>").prependTo(this.core.pages.game.gameUI);
		
		var string = "";
		data.rules.forEach(function(v, i) {
			
			var selector = "#gameUI ";
			
			if (v.id) {
				if (this.elements.indexOf(v.id) >= 0)
					selector = "#" + v.id + " ";
				
				delete v.id;
			}
			
			if (v.selector) {
				v.selector = v.selector.replace(/#/g, "");
				selector += v.selector;
				
				delete v.selector;
			}
			
			string += selector + "{\n";
			
			for (var p in v)
				if (v.hasOwnProperty(p))
					
					//We only allow a z-index of less than 1000, which makes sure esc work
					if (p != "z-index" || v[p] < 1000)
						string += p + ": " + v[p] + ";\n";
			
			string += "}\n\n";
			
		}.bind(this));
		
		this.css.append(string);
	
	break; case "div": case "span":
		
		//Create it
		var ele = $("<" + data.tag + ">");
		
		//Push to element array
		this.elements.push(ele);
		
		//Set ID; if ID, then set value in elements array
		if (typeof data.id != "undefined") {
			var check = document.getElementById(data.id);
			
			if (!check) {
				this.elements[data.id] = ele;
				ele.attr("id", data.id);
			}
		}
		
		//Place it
		if (typeof parent != "undefined")
			ele.appendTo(parent);
		else if (typeof data.parent == "undefined" || this.elements[data.parent] == "undefined")
			ele.appendTo(this.core.pages.game.gameUI);
		else
			ele.appendTo(this.elements[data.parent]);
		
		//Some text
		if (typeof data.text != "undefined")
			ele.text(data.text);
		
		//Classes
		if (typeof data.class != "undefined")
			ele.addClass(data.class);
		
		//And children
		if (typeof data.children != "undefined")
			for (var i = 0; i < data.children.length; i++)
				this.addElement(data.children[i], ele);
	
	break; default: 
		throw "Unsupported element type"
	}
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
	console.log("clear");
	this.protocol = null;
	
	if (this.sandbox != null) {
		this.sandbox.terminate();
		this.sandbox = null;
	}
	
	for (var i = this.graphic.scene.children.length - 1; i > -1; i--)
		this.graphic.scene.remove(this.graphic.scene.children[i]);
	
	this.graphic.activeMeshes = [];
	
	this.core.pages.game.gameUI.empty();
	
	this.widgets = [];
	this.elements = [];
	delete this.css;
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
	
	//Create camera and lights
	this.graphic.loadBaseScene();
	
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
	$(this.host).on("onLeave", this.onLeave.bind(this));
	$(this.host).on("onBroadcast", this.onBroadcast.bind(this));
	$(this.host).on("onEcho.Game", this.onEcho.bind(this));
	
	//Other
	this.pinger = setInterval(this.ping.bind(this), 1000);
};
