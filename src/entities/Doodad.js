
import { Mesh } from "../../node_modules/three/build/three.module.js";

import Handle from "../core/Handle.js";
import { isBrowser } from "../misc/env.js";

class Doodad extends Handle {

	constructor( props = {} ) {

		if ( props.x === undefined ) props.x = 0;
		if ( props.y === undefined ) props.y = 0;
		if ( props.z === undefined ) props.z = 0;
		if ( props.facing === undefined ) props.facing = 0;
		if ( props.radius === undefined ) props.radius = 0;
		if ( props.min === undefined ) {

			props.min = {};
			Object.defineProperties( props.min, { x: { get: () => this.x - this.radius }, y: { get: () => this.y + this.radius } } );

		}
		if ( props.max === undefined ) {

			props.max = {};
			Object.defineProperties( props.max, { x: { get: () => this.x - this.radius }, y: { get: () => this.y + this.radius } } );

		}

		super( props );

		this.baseHref = props.base;

		this.updates = [];
		this.renders = [];

		this._props = {};

		if ( this.entityType === Doodad ) Object.assign( this, props );

		this._dirty = 0;

	}

	get key() {

		return "d" + this.id;

	}

	set key( key ) {

		this.id = parseInt( key.slice( 1 ) );

	}

	get model() {

		return this._props.model;

	}

	_setModel( klass, details ) {

		this.mesh = new klass( details );

		this.mesh.userData = this.id;
		this.mesh.position.x = this._props.x || 0;
		this.mesh.position.y = this._props.y || 0;
		this.mesh.position.z = this._props.z || 0;

		if ( this.owner && this.mesh.accentFaces ) {

			for ( let i = 0; i < this.mesh.accentFaces.length; i ++ )
				this.mesh.geometry.faces[ this.mesh.accentFaces[ i ] ].color.set( this.owner.color.hex );

			this.mesh.geometry.colorsNeedUpdate = true;

		}

	}

	_fixRootPath( path ) {

		if ( path.startsWith( "/" ) ) return ( this.baseHref || "" ) + path;

		return path;

	}

	set model( model ) {

		const path = model.mesh || model;

		if ( typeof path === "string" ) return import( this._fixRootPath( path ) ).then( imported => this._setModel( imported.default, model ) );

		if ( typeof path === "function" && ! ( path.prototype instanceof Mesh ) )
			return path().then( imported => this._setModel( imported.default, model ) );

		this._setModel( path, model );

	}

	get mesh() {

		return this._props.mesh;

	}

	set mesh( mesh ) {

		if ( this._props.mesh instanceof Mesh )
			this.dispatchEvent( "meshUnloaded" );

		this._props.mesh = mesh;

		this.dispatchEvent( "meshLoaded" );

	}

	get x() {

		if ( typeof this._props.x === "function" ) return this._props.x();

		return this._props.x;

	}

	set x( x ) {

		if ( typeof x === "function" && typeof this._props.x !== "function" ) ++ this.dirty;
		else if ( typeof x !== "function" ) {

			if ( this.mesh ) this.mesh.position.x = x;
			if ( typeof this._props.x === "function" ) -- this.dirty;

		}

		this._props.x = x;

	}

	get y() {

		if ( typeof this._props.y === "function" ) return this._props.y();

		return this._props.y;

	}

	set y( y ) {

		if ( typeof y === "function" && typeof this._props.y !== "function" ) ++ this.dirty;
		else if ( typeof y !== "function" ) {

			if ( this.mesh ) this.mesh.position.y = y;
			if ( typeof this._props.y === "function" ) -- this.dirty;

		}

		this._props.y = y;

	}

	get z() {

		if ( typeof this._props.z === "function" ) return this._props.z();

		return this._props.z;

	}

	set z( z ) {

		if ( typeof z === "function" && typeof this._props.z !== "function" ) ++ this.dirty;
		else if ( typeof z !== "function" ) {

			if ( this.mesh ) this.mesh.position.z = z;
			if ( typeof this._props.z === "function" ) -- this.dirty;

		}

		this._props.z = z;

	}

	get dirty() {

		return this._dirty;

	}

	set dirty( dirt ) {

		if ( isNaN( dirt ) ) dirt = 0;

		if ( ! this._dirty && dirt ) this.dispatchEvent( "dirty" );
		else if ( this._dirty && ! dirt ) this.dispatchEvent( "clean" );

		this._dirty = dirt;

	}

	remove() {

		if ( this.mesh ) this.dispatchEvent( "meshUnloaded" );

		super.remove();

	}

	toState() {

		return Object.assign( super.toState(), {
			x: this._props.x || this.x,
			y: this._props.y || this.y,
			z: this._props.z || this.z,
			facing: this._props.facing || this.facing
		} );

	}

	render( time ) {

		if ( ! isBrowser || ! this.mesh ) return;

		if ( typeof this._props.x === "function" ) this.mesh.position.x = this._props.x( time );
		if ( typeof this._props.y === "function" ) this.mesh.position.y = this._props.y( time );

		for ( let i = 0; i < this.renders.length; i ++ )
			this.renders[ i ]( time );

	}

	update( time ) {

		for ( let i = 0; i < this.updates.length; i ++ )
			this.updates[ i ]( time );

	}

}

Handle.entityTypes.push( Doodad );

export default Doodad;
