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

/*
var shape = new THREE.TextGeometry("Username", {size: 300, font: 'helvetiker'});
	shape.computeBoundingBox();
	var offset = (shape.boundingBox.min.x + shape.boundingBox.max.x)/2
var wrapper = new THREE.MeshLambertMaterial({color: 0xffffff});
//var wrapper = new THREE.MeshPhongMaterial( { color: 0xff0000, specular: 0xffffff, ambient: 0xaa0000 } );
var words = new THREE.Mesh(shape, wrapper);

//words.castShadow = true;
//words.receiveShadow = true;

words.position.x = -offset;
words.position.y = -500;

words.position.z = 300;

//objects.push(words);

g.w.scene.add(words);*/
/*


var geometry = new THREE.CubeGeometry(3000,5000,1);
var material = new THREE.MeshPhongMaterial({color: 0xaa7700});
var cube = new THREE.Mesh(geometry, material);

//cube.castShadow = true;
//cube.receiveShadow = true;

image.scene.add(cube);

var sheep;
image.loader.load('mdl/sheep2.js', loadSheep);
function loadSheep(geometry, material) {
	var material = new THREE.MeshPhongMaterial({map : new THREE.Texture("img/sheep.jpg")});
	sheep = new THREE.Mesh(geometry, material);
	
	sheep.scale.multiplyScalar(1000)
	sheep.position.z = 500;
	sheep.position.y = -500;
	sheep.rotation.y = Math.PI * 45 / 180
	//sheep2.rotate.x = 45;
	
	image.scene.add(sheep);
}


//objects.push(cube);

$(window).click(function(e) {
	var geometry = new THREE.CubeGeometry(100,100,100);
	var material = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
	var cube = new THREE.Mesh(geometry, material);
	//objects.push(cube);
	
	//cube.receiveShadow = true;
	//cube.castShadow = true;
	
	var vector = new THREE.Vector3( ( e.clientX / window.innerWidth ) * 2 - 1, - ( e.clientY / window.innerHeight ) * 2 + 1, 0.9989877781723485);
	image.projector.unprojectVector( vector, image.camera );
	
	cube.position.x = vector.x;
	cube.position.y = vector.y;
	//cube.position.z = vector.z;
	cube.position.z = 350;
	
	console.log(cube);
	
	image.scene.add(cube);
	
});*/