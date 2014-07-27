
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
