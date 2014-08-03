function reloadStylesheets() {
    var queryString = '?reload=' + new Date().getTime();
    $('link[rel="stylesheet"]').each(function () {
        this.href = this.href.replace(/\?.*|$/, queryString);
    });
}

function variablize(i, e) {
	var aVar = e.getAttribute('var');
	var aId = e.getAttribute('id');
	var detach = e.getAttribute('data-detach');
	var hide = e.getAttribute('data-hide');
	
	if (aVar != null || aId != null || detach != null || hide != null) {
		e = $(e);
		if (aVar != null) this[aVar] = e;
		if (aId != null) {
			//console.log("variablize", aId, e, this);
			this[aId] = e;
		}
		
		if (detach != null) e.detach();
		if (hide != null) e.hide();
	}
	
}

$.expr[':'].attrCI = function(node, stackIndex, properties){
    var args = properties[3].split(',').map(function(arg) {
        return arg.replace(/[^0-9a-zA-Z]+/g, '').toLowerCase();
    });
    return $(node).attr(args[0]).toLowerCase() == args[1];
};

function SortBySize(a, b){
	var aSize = a.size;
	var bSize = b.size; 
	return ((aSize > bSize) ? -1 : ((aSize < bSize) ? 1 : 0));
}

function isset(v) {
	return typeof v !== "undefined";
}

constants = {};
function defineConstant(a, b) {
	window[a] = b;
	constants[a] = b;
	return b;
}

function aInB(a, b) {
	for (var i = 0; i < b.length; i++) {
		if (b[i] == a) return true;
	}
	return false;
}

function exists(primary, subs) {
	if (typeof primary != 'undefined') {
		if (typeof subs == 'object' && subs instanceof Array) {
			var test = primary;
			for (var i = 0; i < subs.length; i++) {
				if (typeof test[subs[i]] != 'undefined') {
					var test = test[subs[i]];
				} else return false;
			}
		}
	} else return false;
	return true;
}

$(document).ready(function() {
	//document.oncontextmenu = function() {return false;};

	$(document).mousedown(function(e){
		if (e.button == 2) return false; 
		return true; 
	}); 
});

Ellipse = function() {
	return $("<span></span>")
		.addClass("marchingEllipsis")
		.append($("<span></span>").text("."))
		.append($("<span></span>").text("."))
		.append($("<span></span>").text("."));
}

function applyProperties(obj, props) {
	for (var property in props)
		if (props.hasOwnProperty(property)) {
			if (typeof obj[property] != "undefined") {
				if (typeof props[property] == "object" && props[property] instanceof Object)
					applyProperties(obj[property], props[property]);
				else obj[property] = props[property]
			} else obj[property] = props[property];
		}
}
