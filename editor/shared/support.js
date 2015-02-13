
function Point(size, color) {
	return new THREE.Mesh(
		new THREE.SphereGeometry(size, 32, 32),
		new THREE.MeshBasicMaterial({color: color})
	);
}

//removeA(array[, element1, element2, ...])
//	Removes element1, element2, ... etc from array
function removeA(arr) {
		var what, a = arguments, L = a.length, ax;
		while (L > 1 && arr.length) {
				what = a[--L];
				while ((ax= arr.indexOf(what)) !== -1) {
						arr.splice(ax, 1);
				}
		}
		return arr;
}

function extend(destination, source) {
	for (var k in source)
		if (source.hasOwnProperty(k))
			destination[k] = source[k];
	
	return destination; 
}

function download(filename, text) {
	var pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' +
			encodeURIComponent(text));
	pom.setAttribute('download', filename);
	pom.click();
}

function message(props) {
	if (typeof props == "string") props = {text: props};
	
	if (!message.initialized) {
		message.initialized = true;
		document.body.appendChild(message.container);
	}
	
	var messageWindow = document.createElement('div');
	
	if (props.error)
		var color1 = '#fee',
				color2 = '#dbb';
	else if (props.important)
		var color1 = '#fff',
				color2 = '#777';
	else
		var color1 = '#fff',
				color2 = '#ddd';
	
	messageWindow.style.color = 'black';
	messageWindow.style.width = '12em';
	messageWindow.style.border = '1px solid ' + color2;
	messageWindow.style.borderRadius = '0.33em';
	messageWindow.style.padding = '0.25em 0.5em';
	messageWindow.style.backgroundColor = color1;
	messageWindow.style.boxShadow = '0 0 0.25em 0 ' + color2;
	messageWindow.style.overflow = 'hidden';
	messageWindow.style.marginBottom = '0.5em';
	messageWindow.style.cursor = 'pointer';
	
	if (props.important)
		messageWindow.style.fontWeight = 'bold'
	
	messageWindow.innerText = props.text;
	
	message.container.insertBefore(messageWindow, message.container.firstChild);
	
	var opacity, height, interval;
	
	function intervalFunc() {
		opacity -= 0.02;
		
		messageWindow.style.height = height * opacity + 'px';
		messageWindow.style.padding = 0.25 * opacity + 'em 0.5em';
		
		if (opacity <= 0) {
			clearInterval(interval);
			message.container.removeChild(messageWindow);
		}
	}
	
	function timeoutFunc() {
		opacity = 1;
		
		var styles = window.getComputedStyle(messageWindow);
		height = parseFloat(styles.height);
		
		interval = setInterval(intervalFunc, 10);
	}
	
	var timeout = setTimeout(timeoutFunc, 5000 + props.text.length*40);
	
	messageWindow.addEventListener('click', function() {
		clearTimeout(timeout);
		timeoutFunc();
	});
	
}
message.container = document.createElement('div');
message.container.style.position = 'absolute';
message.container.style.zIndex = 6;
message.container.style.right = '0.5em';
message.container.style.top = '0.5em';
message.initialized = false;

function selectText(element) {
	var range, selection;
	
	if (typeof element === 'string')
		element = document.getElementById(element);
	
	if (document.body.createTextRange) {
		range = document.body.createTextRange();
		range.moveToElementText(element);
		range.select();
	} else if (window.getSelection) {
		selection = window.getSelection();        
		range = document.createRange();
		range.selectNodeContents(element);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}
