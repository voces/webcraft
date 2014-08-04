
/*
	Description:
		Adds argument-based functions for an easy interface to natives
	
	Provides:
		function setText(String id, [String text])
		function addHTML(Object html)
		function removeElement(String id)
		function emptyElement(String id)
*/

function setText(id, text) {
	postMessage({
		_func: "setText", 
		id: id.replace(/#/g, "&35;"),
		text: text
	});
}

function addHTML(html) {
	postMessage({
		_func: "addHTML", 
		html: html
	});
}

function removeElement(id) {
	postMessage({
		_func: "removeElement", 
		id: id.replace(/#/g, "&35;")
	});
}

function emptyElement(id) {
	postMessage({
		_func: "emptyElement", 
		id: id.replace(/#/g, "&35;")
	});
}
