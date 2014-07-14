Player = function(timestamp, name) {
	this.name = name;
	this.options = {};
	
	var pids = [];
	e.objects.forEach(function (v) {
		v = v.get(timestamp);
		if (v instanceof Player) pids.push(v.pid.get(timestamp));
	});
	
	for (var i = 0; true; i++) {
		if ($.inArray(i, pids) == -1) {
			this.pid = new DynamicVariable(i, timestamp);
			break;
		}
	}
	
	if (e.mapData.player.options) {
		e.mapData.player.options.forEach(this.fillOptionsLoop.bind(this, timestamp));
	}
}

Player.prototype.fillOptionsLoop = function(timestamp, v) {
	if (isset(v.options)) {
		if (isset(e.mapData.player.players[this.pid.get(timestamp)][v.name].value)) {
			this.options[v.name] = {};
			this.options[v.name].value = e.mapData.player.players[this.pid.get(timestamp)][v.name].value;
			
			if (isset(v.fixed)) this.options[v.name].fixed = v.fixed;
			if (isset(v.unique)) this.options[v.name].unique = v.unique;
			
			if (isset(e.mapData.player.players[this.pid.get(timestamp)][v.name].fixed)) this.options[v.name].fixed = e.mapData.player.players[this.pid.get(timestamp)][v.name].fixed;
			if (isset(e.mapData.player.players[this.pid.get(timestamp)][v.name].unique)) this.options[v.name].unique = e.mapData.player.players[this.pid.get(timestamp)][v.name].unique;
		}
	}
}

Player.prototype.changePid = function(newPid, timestamp) {
	var oldPid = this.pid.get(timestamp);
	this.pid.set(newPid, timestamp);
	
	this.options = [];
	
	if (e.mapData.player.options) {
		e.mapData.player.options.forEach(this.fillOptionsLoop.bind(this));
	}
}