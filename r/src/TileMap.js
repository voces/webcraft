
function TileMap(props) {
	
	if (typeof props == "undefined") props = {};
	
	props.model = props.model || {
		type:  "simple",
		geometry: {
			shape: "PlaneGeometry",
			width: 	100*16,
			height:	100*16,
			widthSegments:	100,
			heightSegments:	100
		},
		material: {
			type: "LineBasicMaterial",
			color: "white"
		}
	};
	
	Widget.apply(this, [props]);
	
	applyProperties(this, props);
}

TileMap.prototype = Object.create(Widget.prototype);

