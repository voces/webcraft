
//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License

function EventTarget(){
    this._listeners = {};
}

EventTarget.prototype.on = function(type, listener) {
	if (typeof this._listeners[type] == "undefined"){
		this._listeners[type] = [];
	}

	this._listeners[type].push(listener);
};

EventTarget.prototype.fire = function(type, event) {
	if (!event) event = {target: this};
	else if (!event.target) event.target = this;
	
	if (this._listeners[type] instanceof Array){
		var listeners = this._listeners[type];
		for (var i=0, len=listeners.length; i < len; i++)
			listeners[i].call(this, event);
	}
};

EventTarget.prototype.off = function(type, listener) {
	if (this._listeners[type] instanceof Array) {
		var listeners = this._listeners[type];
		for (var i=0, len=listeners.length; i < len; i++) {
			if (listeners[i] === listener){
				listeners.splice(i, 1);
				break;
			}
		}
	}
};
