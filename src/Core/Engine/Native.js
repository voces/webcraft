Natives = function() {
	
}

//*******************************
//**	Returns nothing
//*******************************

Natives.prototype.EnableTimer = function(context, timestamp, timer) {
	timer = e.getReference(timer,  context, timestamp);
	
	while (timer instanceof DynamicVariable) timer = get(timestamp, timer);
	
	if (timer instanceof Timer) {
		timer.enabled = true;
		
		timer.timestamp = timestamp;
		
		timer.timeoutFunc();
	}
}

Natives.prototype.DisableTimer = function(context, timestamp, timer) {
	timer = e.getReference(timer,  context, timestamp);
	
	while (timer instanceof DynamicVariable) timer = get(timestamp, timer);
	
	if (timer instanceof Timer) {
		timer.timeoutFunc(true);
		timer.enabled = false;
		e.backTrack(timestamp);
	}
}

Natives.prototype.PrintPlayerMessage = function(context, timestamp, player, message) {
	player = get(timestamp, e.getReference(player,  context, timestamp));
	message = get(timestamp, e.getReference(message,  context, timestamp));
	
	var playerSpan = $('<span></span>')
		.text(player.name + ": ")
		.css('font-weight', 'bold');
	
	if (player.options && player.options._color && player.options._color.value)
		playerSpan.css('color', player.options._color.value);
		
	var total = $('<span></span>').append(playerSpan).append(message);
	
	game.chatbox.append(total);
}

Natives.prototype.loop = function(context, timestamp, init, conditions, steps, callbacks, terminate, repetition) {
	
	if (!repetition) e.runBlock(init, timestamp, context, false);
	
	if (!conditions || e.runBlock(conditions, timestamp, context, false)) {
		e.runBlock(callbacks, timestamp, context, false);
		e.runBlock(steps, timestamp, context, false);
		this.loop(context, timestamp, init, conditions, steps, callbacks, terminate, true);
	} else e.runBlock(terminate, timestamp, context, false);
}

Natives.prototype.RemoveUnit = function(context, timestamp, unit) {
	unit = e.getReference(unit, context, timestamp);
	
	if (unit instanceof DynamicVariable) {
		var mesh = get(timestamp, unit).mesh;
		unit.set(null, timestamp);
	}
	
	g.w.scene.remove(mesh);
}

Natives.prototype.SetStarlight = function(context, timestamp, colorcode) {
	colorcode = get(timestamp, e.getReference(colorcode, context, timestamp));
	
	if (typeof colorcode == "string") g.w.stars.color.setHex('0x' + colorcode);
}

Natives.prototype.SetUnitX = function(context, timestamp, unit, x) {
	unit = get(timestamp, e.getReference(unit, context, timestamp));
	x = get(timestamp, e.getReference(x, context, timestamp));
	
	while (unit instanceof DynamicVariable) unit = get(timestamp, unit); //we do again because first we got the value of "unit" variable, now we get value of "unit" object (also dynamic)
		//Technically we should do this kind of shit for a lot more things where we expect to be working with non-Dynamics (their children)
	
	var xCast = parseFloat(x);
	var yCast = parseFloat(get(timestamp, unit.y));
	
	if (isset(unit) && unit instanceof Unit) {
		if (e.vectorMap.polygonInPolygon(e.vectorMap.polygonToPoint(unit.type.polygon, xCast, yCast), e.vectorMap.worldPolygon) && e.vectorMap.placeableUnit(timestamp, unit, xCast, yCast)) {
			unit.x = set2(unit.x, x, timestamp);
			unit.flagGraphicUpdate = true;
		}
	}
}

Natives.prototype.SetUnitY = function(context, timestamp, unit, y) {
	unit = get(timestamp, e.getReference(unit, context, timestamp));
	y = get(timestamp, e.getReference(y, context, timestamp));
	
	while (unit instanceof DynamicVariable) unit = get(timestamp, unit);
	
	var xCast = parseFloat(get(timestamp, unit.x));
	var yCast = parseFloat(y);
	
	if (isset(unit) && unit instanceof Unit) {
		if (e.vectorMap.polygonInPolygon(e.vectorMap.polygonToPoint(unit.type.polygon, xCast, yCast), e.vectorMap.worldPolygon) && e.vectorMap.placeableUnit(timestamp, unit, xCast, yCast)) {
			unit.y = set2(unit.y, y, timestamp);
			unit.flagGraphicUpdate = true;
		}
	}
}

//*******************************
//**	Returns many
//*******************************

Natives.prototype.Child = function(context, timestamp, a, b) {	//returns many
	a = get(timestamp, e.getReference(a,  context, timestamp));
	b = get(timestamp, e.getReference(b,  context, timestamp));
	
	if (isset(a)) {
		if (typeof a == 'object') {
			if (a instanceof Array) {
				if (isset(a[b])) return a[b];
				else return a[b] = new DynamicVariable(null, timestamp);
			} else {
				if (isset(a.objects) && isset(a.objects[b])) return a.objects[b];
				else return;
			}
		} else return;
	} else return;
}

Natives.prototype.EventData = function(context, timestamp, data) {	//returns many
	data = get(timestamp, e.getReference(data,  context, timestamp));
	
	var event = e.getObjectByAttribute(e.eventManager.eventLog, 'timestamp', timestamp);
	
	if (event) {
		if (isset(event[data])) return event[data];
		else return event.data[data];
	} else return;
}

Natives.prototype.ForEvery = function(context, timestamp, arr, value, callbacks) {
	var arr = get(timestamp, e.getReference(arr, context, timestamp));
	
	if (isset(arr)) {
		arr.forEach(function(v) {
			context.objects[value] = v;
			e.getReference(callbacks, context, timestamp);
		});
	}
	
	return arr;
}

Natives.prototype.GetValueAt = function(context, timestamp, variable, time) {	//returns many
	variable = e.getReference(variable,  context, timestamp);
	time = e.getReference(time,  context, timestamp);
	
	while (time instanceof DynamicVariable) time = get(timestamp, time);
	
	while (variable instanceof DynamicVariable) variable = get(time, variable);
	
	return variable;
}

Natives.prototype.Set = function(context, timestamp, variable, value) {	//returns many
	variable = e.getReference(variable,  context, timestamp);
	value = e.getReference(value,  context, timestamp);
	
	while (value instanceof DynamicVariable) value = get(timestamp, value);
	
	variable = set2(variable, value, timestamp);
}

Natives.prototype.Si = function(context, timestamp, boolexpr, a, b) {	//returns many
	var boolexpr_evaluated = get(timestamp, e.getReference(boolexpr, context, timestamp));
	
	if (boolexpr_evaluated == true) {
		return e.getReference(a, context, timestamp);
	} else {
		return e.getReference(b, context, timestamp);
	}
}

//*******************************
//*******************************
//**	Returns natives
//*******************************
//*******************************

//*******************************
//**	Returns array
//*******************************

Natives.prototype.Array = function(context, timestamp, arr) {	//returns array
	var newArr = [];
	
	if (isset(arr)) {
		if (typeof arr == 'array') {
			arr.forEach(function(v) {
				newArr.push(v);
			});
		} else if (typeof arr == 'object' && isset(arr.objects)) {
			arr.objects.forEach(function(v) {
				newArr.push(v);
			});
		} else {
			newArr.push(arr);
		}
	}
	
	return newArr;
}

Natives.prototype.Finalize = function(context, timestamp, block) {	//returns array
	if (typeof block == 'object' && block instanceof Array && block[2])
		block[2] = e.getReference(block[2], context, timestamp);
	
	return block;
}

Natives.prototype.GetUnitsInRange = function(context, timestamp, x, y, range) {	//returns array
	var x = get(timestamp, e.getReference(x, context, timestamp));
	var y = get(timestamp, e.getReference(y, context, timestamp));
	var range = get(timestamp, e.getReference(range, context, timestamp));
	
	x = parseFloat(x);
	y = parseFloat(y);
	range = parseFloat(range);
	
	var units = [];
	
	e.objects.forEach(function(v) {
		v2 = get(timestamp, v);
		
		if (v2 instanceof Unit && Math.sqrt((get(timestamp, v2.x) - x)*(get(timestamp, v2.x) - x)+(get(timestamp, v2.y) - y)*(get(timestamp, v2.y) - y)) <= range) units.push(v);
	});
	
	return units;
}

Natives.prototype.GetUnitsOfPlayer = function(context, timestamp, player) {	//returns array
	var player = e.getReference(player, context, timestamp);
	
	while (player instanceof DynamicVariable) player = get(timestamp, player);
	
	var units = [];
	
	e.objects.forEach(function(v) {
		var v2 = v;
		while (v2 instanceof DynamicVariable) v2 = get(timestamp, v2);
		
		if (v2 instanceof Unit && isset(v2.player)) {
			var player2 = v2.player;
			while (player2 instanceof DynamicVariable) player2 = get(timestamp, player2);
			
			if (player2 == player) units.push(v);
		}
	});
	
	return units;
}

//*******************************
//**	Returns boolean
//*******************************

Natives.prototype.AndArray = function(context, timestamp, arr) {	//returns boolean
	var arr = e.getReference(arr, context, timestamp);
	
	while (arr instanceof DynamicVariable) arr = get(timestamp, arr);
	
	if (typeof arr == 'object' && arr instanceof Array) {
		for (var i = 0; i < arr.length; i++)
			if (arr[i] == false) return false;
		
		return true;
	} else return;
}

Natives.prototype.Equal = function(context, timestamp, a, b) {	//returns boolean
	var a = get(timestamp, e.getReference(a, context, timestamp));
	var b = get(timestamp, e.getReference(b, context, timestamp));
	
	return a == b;
}

Natives.prototype.Exists = function(context, timestamp, variable) {	//returns boolean
	var r = get(timestamp, e.getReference(variable, context, timestamp));
	
	return isset(r);
}

Natives.prototype.GreaterThan = function(context, timestamp, a, b) {	//returns boolean
	var a = get(timestamp, e.getReference(a, context, timestamp));
	var b = get(timestamp, e.getReference(b, context, timestamp));
	
	return a > b;
}

Natives.prototype.LessThan = function(context, timestamp, a, b) {	//returns boolean
	var a = get(timestamp, e.getReference(a, context, timestamp));
	var b = get(timestamp, e.getReference(b, context, timestamp));
	
	
	return a < b;
}

Natives.prototype.OrArray = function(context, timestamp, arr) {	//returns boolean
	var arr = e.getReference(arr, context, timestamp);
	
	while (arr instanceof DynamicVariable) arr = get(timestamp, arr);
	
	if (typeof arr == 'object' && arr instanceof Array) {
		for (var i = 0; i < arr.length; i++) {
			var arrTest = e.getReference(arr[i], context, timestamp);
			while (arrTest instanceof DynamicVariable) arrTest = get(timestamp, arrTest);
			
			if (arrTest == true) return true;
		}
		
		return false;
	} else return;
}

//*******************************
//**	Returns number
//*******************************

Natives.prototype.Add = function(context, timestamp, a, b) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	b = get(timestamp, e.getReference(b, context, timestamp));
	
	return parseFloat(a) + parseFloat(b);
}

Natives.prototype.CastNumber = function(context, timestamp, a) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	
	if (a instanceof Player) return get(timestamp, Player.pid);
	else return parseFloat(a);
}

Natives.prototype.Cos = function(context, timestamp, a) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	
	return Math.cos(a);
}

Natives.prototype.Divide = function(context, timestamp, dividend, divisor) {	//returns number
	dividend = get(timestamp, e.getReference(dividend, context, timestamp));
	divisor = get(timestamp, e.getReference(divisor, context, timestamp));
	
	return parseFloat(dividend) / parseFloat(divisor);
}

Natives.prototype.GetPlayerId = function(context, timestamp, player) {	//returns number
	player = e.getReference(player, context, timestamp);
	
	while (player instanceof DynamicVariable) player = get(timestamp, player);
	
	if (player instanceof Player) return get(timestamp, player.pid);
}

Natives.prototype.GetForceSize = function(context, timestamp, force) {	//returns number
	force = get(timestamp, e.getReference(force, context, timestamp));
	
	if (force instanceof Force) return force.objects.length;
}

Natives.prototype.GetMapHeight = function(context, timestamp) {	//returns number
	return e.mapData.terrain.geometry.height;
}

Natives.prototype.GetMapWidth = function(context, timestamp) {	//returns number
	return e.mapData.terrain.geometry.width;
}

Natives.prototype.GetTimestamp = function(context, timestamp) {	//returns number
	return timestamp;
}

Natives.prototype.GetUnitX = function(context, timestamp, unit) {
	unit = get(timestamp, e.getReference(unit, context, timestamp));
	
	while (unit instanceof DynamicVariable) unit = get(timestamp, unit);
	
	if (isset(unit) && unit instanceof Unit)
		return get(timestamp, unit.x);
	else
		return;
}

Natives.prototype.GetUnitY = function(context, timestamp, unit) {
	unit = get(timestamp, e.getReference(unit, context, timestamp));
	
	while (unit instanceof DynamicVariable) unit = get(timestamp, unit);
	
	if (isset(unit) && unit instanceof Unit)
		return get(timestamp, unit.y);
	else
		return;
}

Natives.prototype.Multiply = function(context, timestamp, a, b) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	b = get(timestamp, e.getReference(b, context, timestamp));
	
	return parseFloat(a) * parseFloat(b);
}

Natives.prototype.Pi = function(context, timestamp) {	//returns number
	return 3.1415926535897932384626433832795028841971693993751058209749446;
}

Natives.prototype.Sin = function(context, timestamp, a) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	
	return Math.sin(a);
}

Natives.prototype.Subtract = function(context, timestamp, a, b) {	//returns number
	a = get(timestamp, e.getReference(a, context, timestamp));
	b = get(timestamp, e.getReference(b, context, timestamp));
	
	return parseFloat(a) - parseFloat(b);
}

//*******************************
//**	Returns string
//*******************************

Natives.prototype.GetString = function(context, timestamp, id) {	//returns string
	id = get(timestamp, e.getReference(id, context, timestamp));
	
	return e.procedures.strings[id];
}

//*******************************
//*******************************
//**	Returns classes
//*******************************
//*******************************

//*******************************
//**	Returns Force
//*******************************

Natives.prototype.GetAllPlayers = function(context, timestamp) {	//returns Force
	var force = new Force();
	e.players.forEach(function(v) {
		v2 = get(timestamp, v);
		if (v2 instanceof Player)
			force.objects.push(v);
	});
	return force;
}

//*******************************
//**	Returns Player
//*******************************

Natives.prototype.GetPlayerByName = function(context, timestamp, name) {	//returns Player
	name = get(timestamp, e.getReference(name, context, timestamp));
	
	return e.getPlayerByName(timestamp, name);
}

//*******************************
//**	Returns Timer
//*******************************

Natives.prototype.CreateTimer = function(context, timestamp, timeout, callback, enabled) {	//returns Trigger
	return new Timer(timestamp, context, timeout, callback, enabled);
}

//*******************************
//**	Returns Trigger
//*******************************

Natives.prototype.CreateTrigger = function(context, timestamp, events, networkconditions, conditions, callbacks) {	//returns Trigger
	return new Trigger(timestamp, context, events, networkconditions, conditions, callbacks);
}

//*******************************
//**	Returns Unit
//*******************************

Natives.prototype.CreateUnit = function(context, timestamp, player, type, x, y) {	//returns Unit
	player = get(timestamp, e.getReference(player, context, timestamp));
	type = get(timestamp, e.getReference(type, context, timestamp));
	x = get(timestamp, e.getReference(x, context, timestamp));
	y = get(timestamp, e.getReference(y, context, timestamp));
	
	r = new Unit(timestamp, type, player, x, y);
	
	return r;
}

//*******************************
//**	Returns UnitType
//*******************************

Natives.prototype.GetUnitTypeByName = function(context, timestamp, name) {	//returns UnitType
	name = get(timestamp, e.getReference(name, context, timestamp));
	
	return e.getObjectByAttribute(e.objectTypes.units, 'name', name);
}