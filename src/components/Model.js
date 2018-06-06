
import Component from "../../node_modules/knack-ecs/src/Component.js";

export default class Model extends Component {

	constructor( object3D ) {

		super();

		Object.defineProperties( this, {
			_object3D: { writable: true }
		} );

		if ( object3D ) this.object3D = object3D;

	}

	set object3D( object3D ) {

		if ( object3D === this._object3D ) return;

		const previousValue = this._object3D;
		this._object3D = object3D;
		setTimeout( () => this.dispatchEvent( "updated", { field: "object3D", previousValue } ) );

	}

	get object3D() {

		return this._object3D;

	}

	set x( x ) {

		if ( ! this._object3D ) return;

		this._object3D.position.x = x;

	}

	get x() {

		if ( ! this._object3D ) return NaN;

		return this._object3D.position.x;

	}

}
