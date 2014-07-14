EventManager = function() {
	this.eventLog = [];
};

EventManager.prototype.onLog = function(data) {
	var log = arguments[1].log;
	
	$.each(log, function(i,v) {
		this.onEvent(v);
	}.bind(this));
};

EventManager.prototype.onEvent = function(event) {
	if (!("id" in event)) event = event[0];
	
	this.eventLog.push(event);
	
	e.timeDifference = Date.now()/1000 - event.timestamp;
	
	/*if (event.id == EVENT_PLAYER_PING) e.eventManager.onPing(event);
	else if (event.id == EVENT_PLAYER_JOIN) e.eventManager.onPlayerJoin(event);
	else if (event.id == EVENT_PLAYER_LEAVE) e.eventManager.onPlayerLeave(event);
	else if (event.id == EVENT_PLAYER_PID) e.eventManager.onPlayerPid(event);
	else if (event.id == EVENT_PLAYER_START) e.eventManager.onStart(event);
	
	e.objects.forEach(function(v) {
		v2 = get(event.timestamp, v);
		if (v2 instanceof Trigger && v2.event == event.id && e.getReference(v2.conditions, v2.context, event.timestamp)) {
			e.runBlock(v2.callbacks, event.timestamp, v2.context);
		}
	});*/
};

EventManager.prototype.onPlayerJoin = function(event) {
	var player = new Player(event.timestamp, event.account);
	
	e.players.push(new DynamicVariable(player, event.timestamp));
	
	attach.doAfter({player:player});
};

EventManager.prototype.onPlayerLeave = function(event) {
	var player = e.getPlayerByName(event.timestamp, event.account);
	
	attach.doBefore({player:player.get(event.timestamp)});
	
	player.set(null, event.timestamp);
};

EventManager.prototype.onPlayerPid = function(event) {
	var player = e.getPlayerByName(timestamp, event.account);
	
	attach.doBefore({event:event,player:player});
	
	player.changePid(event.data.pid);
	
	attach.doAfter({event:event,player:player});
};

EventManager.prototype.onStart = function(event) {
	e.procedures = e.toJSON(e.mapData.procedures);
	
	e.loadObjects();
	e.vectorMap.load();
	e.procedures.forEach(function(v) {
		e.runBlock(v, event.timestamp, e, true);
	});
	
	attach.doAfter({event:event});
};

EventManager.prototype.onPing = function(event) {
	if (event.account == con.account) {
		e.pings.push((Date.now() - event.data.start));
		
		if (e.pings.length == 6) e.pings.shift();
		
		var clone = e.pings.slice(0);
		clone.sort(function(a,b){return a-b});
		
		e.ping = clone[parseInt(clone.length/2)].toFixed(0);
		
		game.latency.update(e.ping);
		//game.latency.update(JSON.stringify(clone));
	}
};

EventManager.prototype.preOnKeyDown = function(event) {
	if (g.hud.layer() == 'game' && (!e.keys[event.which] || e.keys[event.which] == false)) {
		var now = Date.now() / 1000;
		e.eventManager.eventLog.push({account: con.host.account, id:EVENT_PLAYER_KEYDOWN, data:{keyid: event.which}, timestamp: now});
		
		e.objects.some(function (v) {
			while (v instanceof DynamicVariable) v = get(now, v);
			
			if (v instanceof Trigger && v.event == EVENT_PLAYER_KEYDOWN && v.preCheck(now)) {
				e.eventManager.eventLog.pop();
				con.host.input(EVENT_PLAYER_KEYDOWN, {keyid: event.which});
				return true;
			}
		});
	}
	
	e.keys[event.which] = true;
};

EventManager.prototype.preOnKeyUp = function(event) {
	if (g.hud.layer() == 'game' && (!e.keys[event.which] || e.keys[event.which] == true)) {
		var now = Date.now() / 1000;
		e.eventManager.eventLog.push({account: con.host.account, id:EVENT_PLAYER_KEYUP, data:{keyid: event.which}, timestamp: now});
		
		e.objects.some(function (v) {
			while (v instanceof DynamicVariable) v = get(now, v);
			
			if (v instanceof Trigger && v.event == EVENT_PLAYER_KEYUP && v.preCheck(now)) {
				e.eventManager.eventLog.pop();
				con.host.input(EVENT_PLAYER_KEYUP, {keyid: event.which});
				return true;
			}
		});
	}
	
	e.keys[event.which] = false;
};
