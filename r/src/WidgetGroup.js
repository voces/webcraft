
/*
	WidgetGroup([array widgets], [object properties])
		.account	returns string
	
	Requires:
		applyProperties.js
*/

WidgetGroup = function(widgets, properties) {
	if (typeof widgets == "object" && widgets instanceof Array)
		for (var i = 0; i < widgets.length; i++)
			this.push(widgets[i]);
	
	applyProperties(this, properties);
};

WidgetGroup.prototype = Object.create(Array.prototype);
