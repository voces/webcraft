
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
