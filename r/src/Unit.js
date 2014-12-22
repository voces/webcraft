
/*
	Requires
		applyProperties.js
		Point.js
		local.js
		Widget.js
	
	Provides
		Unit(Object props, Boolean localize)
*/

function Unit(props) {
	
	Unit.s.push(this);
	widgets.push(this);
	
	applyProperties(this, props);
	
}

Unit.prototype = Object.create(Widget.prototype);
Unit.s = [];
