
import Component from "../../node_modules/knack-ecs/src/Component.js";
import { Mesh } from "../../node_modules/three/build/three.module.js";

export default class Model extends Component {

	constructor( props ) {

		super();

		// Replaceable with static get properties?
		Object.defineProperties( this, {
			_object3D: { writable: true }
		} );

		if ( props instanceof Mesh ) this.object3D = props;
		else Object.assign( this, props );

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

	set y( y ) {

		if ( ! this._object3D ) return;

		this._object3D.position.y = y;

	}

	get y() {

		if ( ! this._object3D ) return NaN;

		return this._object3D.position.y;

	}

	set z( z ) {

		if ( ! this._object3D ) return;

		this._object3D.position.z = z;

	}

	get z() {

		if ( ! this._object3D ) return NaN;

		return this._object3D.position.z;

	}

}
