
import System from "../../node_modules/knack-ecs/src/System.mjs";
import DQuadTree from "../logic/DQuadTree.mjs";

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

		return typeof entity.x === "number" && typeof entity.y === "number" && ! entity.noPathing;

	}

	onEntityMoved( entity ) {

		// TODO: add memoize to util
		let listener = this._listenerMap.get( entity );
		if ( listener ) return listener;

		listener = event => {

			if ( event.target !== entity ) return;
			this._qt.update( entity );

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

}
