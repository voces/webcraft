
import System from "../../node_modules/knack-ecs/src/System.js";
import shapes from "../entities/doodads.js";
import DQuadTree from "../logic/DQuadTree.js";

const { Sphere } = shapes;

export default class Pathing extends System {

	constructor() {

		super();

		Object.defineProperties( this, {
			_qt: { value: new DQuadTree() },
			_listenerMap: { value: new WeakMap() }
		} );

	}

	onUpdatedApp( { prevValue } ) {

		if ( prevValue && prevValue.pathing === this ) delete prevValue.pathing;
		if ( this.app ) this.app.pathing = this;

	}

	test( entity ) {

		// console.log( "testing", entity.id, typeof entity.x === "number", typeof entity.y === "number", ! entity.noPathing );
		return typeof entity.x === "number" && typeof entity.y === "number" && ! entity.noPathing;

	}

	onEntityMoved( entity ) {

		// TODO: add memoize to util
		let listener = this._listenerMap.get( entity );
		if ( listener ) return listener;

		listener = event => {

			if ( event.target !== entity ) return;

			const before = this._qt.length;
			this._qt.update( entity );
			console.log( "onEntityMoved", entity.id, before, this._qt.length );

		};
		this._listenerMap.set( entity, listener );

		return listener;

	}

	onEntityAdded( { entity } ) {

		this._qt.push( entity );

		Object.defineProperty( entity, "enumerateNearby", {
			value: radius => {

				const nearby = this._qt.enumerateInRange( entity, radius );
				const index = nearby.indexOf( entity );
				nearby[ index ] = nearby[ nearby.length - 1 ];
				nearby.pop();
				return nearby;

			},
			enumerable: true,
			configurable: true
		} );

		entity.addEventListener( "updatedX updatedY", this.onEntityMoved( entity ) );

	}

	onEntityRemoved( { entity } ) {

		this._qt.remove( entity );
		delete entity.enumerateNearby;
		delete entity.enumerateCollisons;

		entity.removeEventListener( "updatedX updatedY", this.onEntityMoved( entity ) );

	}

	enumerateInRange( ...args ) {

		return this._qt.enumerateInRange( ...args );

	}

	paint() {

		if ( this.paint.prev ) this.paint.prev.forEach( e => this.app.removeEntity( e ) );
		this.paint.prev = [];

		console.log( "painting" );

		this._qt._breadthCells( ( cell, round ) => {

			if ( ! cell.x ) return;

			console.log( "painting", round, cell.x, cell.y );

			const sphere = new Sphere( { x: cell.x, y: cell.y } );
			sphere.noPathing = true;
			// setTimeout( () => sphere.model._object3D ? sphere.model._object3D.material.color.r = 1 : null, 1000 );
			this.app.addEntity( sphere );
			this.paint.prev.push( sphere );
			console.log( sphere );

		} );

	}

}
