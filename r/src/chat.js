
/*
	
	
	Requires:
		host.js
*/

postMessage({
	_func: "addHTML", 
	html: [
		{tag: "div", id: "chatContainer", children: [
			{tag: "div", id: "chatLog"},
			{tag: "input", id: "chatInput"}]},
		{tag: "style", rules: [
			{id: "chatContainer", position: "absolute", left: "2em", bottom: "3em", width: "20em"},
			{id: "chatInput", display: "none"}]}
	]
});
