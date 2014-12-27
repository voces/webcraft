
/*************************************
**	Emitter class, requires Map
**************************************/

function Emitter() {
	this._listeners = new Map();
}

Emitter.prototype.on = function(type, callback) {
	var listeners = this._listeners.get(type);
	
	if (typeof listeners == "undefined") {
		listeners = [callback];
		this._listeners.set(type, listeners);
	} else listeners.push(callback);
};

Emitter.prototype.off = function(type, listener) {
	var listeners = this._listeners.get(type);
	
	if (typeof listeners == "undefined") return;
	
	if (typeof listener == "undefined")
		while (listners.length) listeners.pop();
	else
		for (var i = 0; i < listeners.length; i++)
			if (listeners[i] == listener) {
				listeners.splice(i, 1);
				i--;
			}
};

Emitter.prototype.fire = function(event) {
	var listeners = this._listeners.get(event.type);
	
	if (typeof listeners == "undefined") return;
	
	for (var i = 0; i < listeners.length; i++)
		listeners[i].call(this, event);
};
