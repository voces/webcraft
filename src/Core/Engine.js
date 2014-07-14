Engine = function() {
	
	this.mapData = {};
	this.procedures = {};
	this.natives = new Natives();
	this.objects = [];
		this.players = [];
		this.units = [];
	this.objectTypes = {units:[]};
	this.keys = [];
	this.pings = [];
	this.ping = 0;
	this.timeDifference = 0;
	this.maxRadius = 0;
	this.g = new Graphic();
	
	//Events
	
	this.eventManager = new EventManager();
	
	//Much of the actual math is adapted from Kevin Lindsey's 2D library
	/*vectorMap: {
		worldPolygon: [],
		
		intersectSegmentSegment: function(aX1, aY1, aX2, aY2, bX1, bY1, bX2, bY2) {
			var result;
			var ua_t = (bX2 - bX1) * (aY1 - bY1) - (bY2 - bY1) * (aX1 - bX1);
			var ub_t = (aX2 - aX1) * (aY1 - bY1) - (aY2 - aY1) * (aX1 - bX1);
			var u_b = (bY2 - bY1) * (aX2 - aX1) - (bX2 - bX1) * (aY2 - aY1);
			if (u_b != 0) {
				var ua = ua_t / u_b;
				var ub = ub_t / u_b;
				if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {	//Simple intersection
					return true;
					//result.points.push(new Point2D(aX1 + ua * (aX2 - aX1), aY1 + ua * (aY2 - aY1)));
				} else	//No intersection
					return false;
			} else {
				if (ua_t == 0 || ub_t == 0)	//Same line
					return false;
				else	//Parallel
					return false;
			}
			return result;
		},
		
		intersectSegmentPolygon: function(x1, y1, x2, y2, polygon) {
			for (var i = 0; i < polygon.length - 1; i++)
				if (e.vectorMap.intersectSegmentSegment(x1, y1, x2, y2, polygon[i][0], polygon[i][1], polygon[i+1][0], polygon[i+1][1])) return true;
			return false;
		},
		
		intersectPolygonPolygon: function(polygon1, polygon2) {
			for (var i = 0; i < polygon1.length - 1; i++)
				if (e.vectorMap.intersectSegmentPolygon(polygon1[i][0], polygon1[i][1], polygon1[i+1][0], polygon1[i+1][1], polygon2)) return true;
			return false;
		},
		
		pointInPolygon: function (x, y, polygon) {
			var counter = 0;
			var x_inter;
			
			for (var i = 0; i < polygon.length - 1; i++) {
				if (y > Math.min(polygon[i][1], polygon[i+1][1])) {
					if (y <= Math.max(polygon[i][1], polygon[i+1][1])) {
						if (x <= Math.max(polygon[i][0], polygon[i+1][0])) {
							if (polygon[i][1] != polygon[i+1][1]) {
								var x_inter = (y - polygon[i][1]) * (polygon[i+1][0] - polygon[i][0]) / (polygon[i+1][1] - polygon[i][1]) + polygon[i][0];
								if (polygon[i][0] == polygon[i+1][0] || x <= x_inter) {
									counter++;
								}
							}
						}
					}
				}
			}
			
			return (counter % 2 == 1);
		},
		
		polygonInPolygon: function(polygon1, polygon2) {
			for (var i = 0; i < polygon1.length - 1; i++) {
				if (!e.vectorMap.pointInPolygon(polygon1[i][0], polygon1[i][1], polygon2)) return false;
			}
			
			return true;
		},
		
		polygonToPoint: function(polygon, x, y) {
			var newPoly = [];
			
			for (var i = 0; i < polygon.length; i++) newPoly.push([x + polygon[i][0], y + polygon[i][1]]);
			
			return newPoly;
		},
		
		polarProject: function(x, y, distance, angle) {
			return [x + distance * Math.cos(angle), y + distance * Math.sin(angle)];
		},
		
		placeableUnit: function(timestamp, unit, originX, originY) {
			var unit = get(timestamp, unit);
			
			var unitX = get(timestamp, unit.x);
			var unitY = get(timestamp, unit.y);
			
			var newPoly = e.vectorMap.polygonToPoint(unit.type.polygon, originX, originY);
			
			for (var i = 0; i < e.units.length; i++) {
				var u = get(timestamp, e.units[i]);
				
				if (u instanceof Unit && u != unit && unit.ignoreCollisons.indexOf(u) == -1) {
					var x = get(timestamp, u.x);
					var y = get(timestamp, u.y);
					var d = Math.pow((originX-x)*(originX-x)+(originY-y)*(originY-y), 1/2);
					
					if (d <= u.type.pathingmap.size - unit.type.pathingmap.size) {		//possibly inside
						if (d <= Math.pow((unitX-x)*(unitX-x)+(unitY-y)*(unitY-y), 1/2)) {	//we are trying to leave, so let it
							var newPoly2 = e.vectorMap.polygonToPoint(u.type.polygon, x, y);
							
							if (!e.vectorMap.polygonInPolygon(newPoly, newPoly2)) return false;
						}
					} else if (d <= u.type.pathingmap.size + unit.type.pathingmap.size) {	//possibly intersect
						if (d <= Math.pow((unitX-x)*(unitX-x)+(unitY-y)*(unitY-y), 1/2)) {	//we are trying to leave, so let it
							var newPoly2 = e.vectorMap.polygonToPoint(u.type.polygon, x, y);
							
							if (e.vectorMap.intersectPolygonPolygon(newPoly, newPoly2)) return false;
						}
					}
				}
			}
			
			return true;
		},
		
		load: function() {
			e.vectorMap.worldPolygon = [];
			if (exists(e, ['mapData', 'terrain', 'geometry'])) {
				e.vectorMap.worldPolygon.push([e.mapData.terrain.geometry.width/-2, e.mapData.terrain.geometry.height/2]);	//top left
				e.vectorMap.worldPolygon.push([e.mapData.terrain.geometry.width/2, e.mapData.terrain.geometry.height/2]);	//top right
				e.vectorMap.worldPolygon.push([e.mapData.terrain.geometry.width/2, e.mapData.terrain.geometry.height/-2]);	//bot right
				e.vectorMap.worldPolygon.push([e.mapData.terrain.geometry.width/-2, e.mapData.terrain.geometry.height/-2]);	//bot left
				e.vectorMap.worldPolygon.push([e.mapData.terrain.geometry.width/-2, e.mapData.terrain.geometry.height/2]);	//top left
			}
		}
	},*/
	
	$(document).ready(this.load.bind(this));
	/*attach.after(con.host.onLog, e.eventManager.onLog);
	attach.after(con.host.onEvent, e.eventManager.onEvent);*/
};
//e.init();

//Code processessing

Engine.prototype.call = function(callable, timestamp, parent, append) {
	var callable = JSON.parse(JSON.stringify(callable));
	
	if (typeof e.natives[callable[1]] == 'function') {
		if (isset(callable[2])) {
			if (callable[2][0] == 'call') {
				callable[2] = [parent, timestamp, callable[2]];
			} else {
				if (!(callable[2] instanceof Array)) callable[2] = [callable[2]];
				
				callable[2].unshift(parent, timestamp);
			}
		} else callable[2] = [parent, timestamp];
		var r = e.natives[callable[1]].apply(e.natives, callable[2]);
		
		if (isset(r) && isset(parent) && append == true) {
			if (parent != e) parent.objects.push(r);
		}
		if (isset(r)) return r;
	} else if (ref = e.getReference(callable[1], parent, timestamp)) {
		var r = ref.get(timestamp).run(timestamp, parent, callable[2]);
		
		if (isset(r) && isset(parent) && append == true) {
			if (parent != e) parent.objects.push(r);
		}
		if (isset(r)) return r;
	} else {
		console.log(callable[1] + " doesn't exist!");
	}
},

Engine.prototype.run = function(callable, timestamp, parent, append) {
	var r;
	if (callable[0] == 'library' && isset(parent)) {
		r = new Library(parent, callable[2]);
		
		if (isset(r)) {
			r = set(parent, callable[1], r, timestamp);
			
			r.get(timestamp).init(timestamp);
			
			return r;
		}
	} else if (callable[0] == 'function') {
		r = new Function(timestamp, parent, callable[2], callable[3]);
		
		if (isset(r)) {
			if (isset(parent) && append === true) {
				r = set(parent, callable[1], r, timestamp);
			}
			
			return r;
		}
		
	} else if (callable[0] == 'var') {
		r = e.getReference(callable[2], parent, timestamp);
		
		if (isset(parent))
			r = set(parent, callable[1], r, timestamp);
		else {
			console.log('new Var');
			r = new DynamicVariable(r, timestamp);
		}
		
		return r;
	} else if (callable[0] == 'call') {			
		if (isset(r)) {
			if (r instanceof Array) r = [r];
			
			var t = e.call(callable, timestamp, parent, append);
			if (isset(t)) r.push(t);
		} else {
			var t = e.call(callable, timestamp, parent, append);
			if (isset(t)) r = t;
		}
		
		if (isset(r)) return r;
	} else if (callable[0] == 'destroy') {
		var t = e.getParent(callable[1], parent);
		if (isset(t)) t.objects[callable[1]].set(null, timestamp);	//we set it to null, not actually delete
	}
},

Engine.prototype.runBlock = function(block, timestamp, parent, append) {
	if (block instanceof Array) {
		var r;
		if (block[0] instanceof Array) {
			block.forEach(function(v) {
				if (isset(r)) {
					if (!(r instanceof Array)) r = [r];
					
					var t = e.runBlock(v, timestamp, parent, append);
					if (isset(t)) r.push(t);
				} else {
					var t = e.runBlock(v, timestamp, parent, append);
					if (isset(t)) r = t;
				}
			});
		} else if (typeof block[0] == 'string') {
			r = e.run(block, timestamp, parent, append);
		}
		if (isset(r)) return r;
	}
},

Engine.prototype.getParent = function(ref, context) {
	if (typeof ref == 'string') {
		if (isset(context.objects)) {
			if (isset(context.objects[ref])) {
				return context;
			} else if (isset(context.parent)) {
				return e.getParent(ref, context.parent);
			}
		}
	}//would do else if we created a function that returns a similar parent type thing... doubtful
},

Engine.prototype.getReference = function(ref, context, timestamp) {
	if (!isNaN(ref)) {
		return ref;
	} else if (typeof ref == 'string') {
		if (isset(context.objects)) {
			if (isset(context.objects[ref])) {
				return context.objects[ref];
			} else if (isset(context.parent)) {
				return e.getReference(ref, context.parent, timestamp);
			}
		}
	} else if (ref instanceof Array) {
		return e.runBlock(ref, timestamp, context, false);
	} else {
		return ref;
	}
},

Engine.prototype.backTrack = function(timestamp) {
	var removedTimestamps = [];
	
	for (var i = 0; i < e.objects.length; i++) {
		if (e.objects[i].values[0][0] > timestamp) {
			removedTimestamps.push(e.objects[i].values[0][0]);
			e.objects.splice(i, 1);
			i--;
		} else {
			for (var n = 0; n < e.objects[i].values.length; n++) {
				if (e.objects[i].values[n][0] > timestamp) {
					removedTimestamps.push(e.objects[i].values[n][0]);
					e.objects[i].values.splice(n, 1);
					n--;
				}
			}
		}
	}
	//console.log('Removing Above', timestamp, Date.now(), removedTimestamps);
},

//Code initializing

Engine.prototype.loadObjects = function() {
	e.mapData.objects.units.forEach(function(v) {
		e.objectTypes.units.push(new UnitType(v));
	});
},

Engine.prototype.toJSON = function(incomingData) {
	var data = '';
	
	/////////////////////////////////////////////
	//	Load in our data
	/////////////////////////////////////////////
	
	$.each(incomingData, function(i, v) {
		if (v.chunck) data += v.chunck;
	});
	
	data = '[' + data + ']';
	
	/////////////////////////////////////////////
	//	Remove strings
	/////////////////////////////////////////////
	
	//Let's replace escaped chars with their HTML equivalent
	data = data.replace(/\\\'/g, '&#39;');
	data = data.replace(/\\\"/g, '&#34;');
	
	var i = 0;
	var strings = [];
	
	data = data.replace(/(\'|")(?:(?!\1).)*\1/g, function(match) {
		//Grab and format strings
		match = match.replace(/&#39;/g, "\\\'");
		match = match.replace(/&#34;/g, '\\\"');
		match = match.substr(1, match.length - 2);
		
		strings.push(match);
		
		return '[call, GetString, ' + i++ + ']';
	});
	
	/////////////////////////////////////////////
	//	Convert to strings
	/////////////////////////////////////////////
	
	data = data.replace(/[\r\t\n]/g, '');	//Remove all return lines and tabs
	data = data.replace(/ *([,|\[|\]]) */g, '$1');	//Remove all spaces leading and following a comma or bracket
	
	data = data.replace(/([^,\[\]]+)/g, '\"$1\"');	//Turn everything
	
	/////////////////////////////////////////////
	//	Convert to JSON
	/////////////////////////////////////////////
	//data = $.parseJSON(data);
	data = window.JSON.parse(data);
	//GLOBALDATA = data;
	if (strings.length > 0) data.strings = strings;	//Append our strings to it
	
	return data;
},

//Support gets

Engine.prototype.getObjectByAttribute = function(list, attr, value) {
	var r;
	
	list.some(function (v) {
		if (v[attr] == value) {
			r = v;
			return true;
		}
	});
	
	return r;
},

Engine.prototype.getOptionByName = function(name) {
	var r;
	
	e.player.options.some(function (v) {
		if (v.name == name) {
			r = v;
			return true;
		}
	});
	
	return r;
},

Engine.prototype.getPlayerByName = function(timestamp, name) {
	var r;
	
	e.objects.some(function (v) {
		v2 = v.get(timestamp);
		if (v2 instanceof Player && v2.name == name) {
			r = v;
			return true;
		}
	});
	
	/*e.players.some(function (v) {
		if (v.name == name) {
			r = v;
			return true;
		}
	});*/
	
	return r;
},

/****************************************
	Calculating pathingmap conflicts
****************************************/

Engine.prototype.getRadius = function(timestamp, context, obj) {
	if (typeof obj.pathingmap == 'undefined') return finalize(timestamp, context, finalize(timestamp, context, obj.type).pathingmap).maxRadius;
	else {
		if (typeof finalize(timestamp, context, obj.pathingmap).maxRadius == 'undefined') return finalize(timestamp, context, finalize(timestamp, context, obj.type).pathingmap).maxRadius;
		else return finalize(timestamp, context, obj.pathingmap).maxRadius;
	}
},

//Gets all units that can possibly be in interference with a root object
Engine.prototype.getObjectsNearObject = function(timestamp, context, obj) {
	var unit = finalize(timestmap, context, obj);
	
	var radius = finalize(timestamp, context, e.getRadius(timestamp, context, unit));
	var x = finalize(timestamp, context, unit.x);
	var y = finalize(timestamp, context, unit.y);
	
	var units = [];
	
	for (var key in e.units) {
		var u = finalize(timestamp, context, e.units[key]);
		
		var uRadius = e.getRadius(timestamp, context, u);
		var uX = finalize(timestamp, context, u.x);
		var uY = finalize(timestamp, context, u.y);
		
		if ((uX-x)*(uX-x)+(uY-y)*(uY-y) < radius + uRadius) units.push(u);
	}
	
	return u;
},

//Resetting

Engine.prototype.clear = function() {
	e.mapData = {};
	e.objects = [];
	e.players = [];
	e.units = [];
	e.eventManager.eventLog = [];
},

//Random tibits and loading

Engine.prototype.ping = function() {
	if (g.hud.layer() != 'game') return;
	
	con.host.input(EVENT_PLAYER_PING, {start: Date.now()});
},

/** Loads up everything x2, after DOM finishes */
Engine.prototype.load = function () {
	/*$(window).bind('keydown', e.eventManager.preOnKeyDown);
	$(window).bind('keyup', e.eventManager.preOnKeyUp);*/
	setInterval(this.ping, 1000);
};
