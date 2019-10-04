
import { PATHING_TYPES, WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import dragSelect from "./dragSelect.js";
import game from "../index.js";
import emitter from "../emitter.js";

// TODO: abstract dom into a class
const arenaElement = document.getElementById( "arena" );

export default emitter( class Sprite {

	static radius = 1;
	static maxHealth = 1;

	// maxHealth = this.constructor.maxHealth;
	// health = this.maxHealth;
	radius = this.radius || this.constructor.radius;
	requiresPathing = PATHING_TYPES.WALKABLE;
	blocksPathing = PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE;
	action;

	constructor( { x, y, selectable = true, id, ...rest } ) {

		emitter( this );
		Object.assign( this, rest );

		this.id = id === undefined ? game.round.spriteId ++ : id;
		this.x = x;
		this.y = y;
		this.maxHealth = this.maxHealth || this.constructor.maxHealth;
		this.health = this.health || this.maxHealth;

		// Display
		this.elem = document.createElement( "div" );
		this.elem.classList.add( this.constructor.name.toLowerCase(), "sprite" );
		this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
		this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";
		this.elem.style.width = this.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		this.elem.style.height = this.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		this.elem.sprite = this;
		arenaElement.appendChild( this.elem );
		if ( selectable ) dragSelect.addSelectables( [ this.elem ] );

		if ( this.owner ) {

			if ( this.owner.color )
				this.elem.style.backgroundColor = this.owner.color.hex;
			this.elem.setAttribute( "owner", this.owner.id );

		}

		// Lists
		if ( this.owner ) this.owner.sprites.push( this );
		if ( game.round ) game.round.sprites.push( this );

		// TODO: move this into getters and setters
		let action;
		Object.defineProperty( this, "action", {
			set: value => {

				if ( action && action.cleanup ) action.cleanup();
				action = value;

			},
			get: () => action,
		} );

	}

	set x( x ) {

		if ( isNaN( x ) ) throw new Error( "Cannot set Sprite#x to NaN" );

		this._x = x;
		if ( this.elem )
			this.elem.style.left = ( x - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

	}

	get x() {

		return this._x;

	}

	set y( y ) {

		if ( isNaN( y ) ) throw new Error( "Cannot set Sprite#y to NaN" );

		this._y = y;
		if ( this.elem )
			this.elem.style.top = ( y - this.radius ) * WORLD_TO_GRAPHICS_RATIO + "px";

	}

	get y() {

		return this._y;

	}

	set selected( value ) {

		this._selected = value;

		if ( this.elem && value )
			this.elem.classList.add( "selected" );
		else
			this.elem.classList.remove( "selected" );

	}

	get selected() {

		return this._selected;

	}

	damage( amount ) {

		if ( this.health <= 0 ) return;
		this.health -= amount;
		if ( this.health <= 0 ) this._death();

	}

	kill( { removeImmediately = false } = {} ) {

		if ( removeImmediately )
			this._death( { removeImmediately: true } );
		else
			this.health = 0;

	}

	set health( value ) {

		this._health = Math.min( Math.max( value, 0 ), this.maxHealth );

		if ( this.elem && this._health )
			this.elem.style.opacity = Math.max( this._health / this.maxHealth, 0.1 );

		if ( value <= 0 && this.isAlive ) {

			this.isAlive = false;
			this._death();

		} else
			this.isAlive = true;

	}

	get health() {

		return this._health;

	}

	_death( { removeImmediately = false } = {} ) {

		if ( removeImmediately ) this._health = 0;

		this.action = undefined;
		dragSelect.removeSelectables( [ this.elem ] );
		if ( this._selected )
			dragSelect.setSelection(
				dragSelect.getSelection().filter( u => u !== this )
			);
		if ( this.owner ) {

			const index = this.owner.sprites.indexOf( this );
			if ( index >= 0 ) this.owner.sprites.splice( index, 1 );

		}
		if ( game.round ) {

			game.round.pathingMap.removeEntity( this );
			const index = game.round.sprites.indexOf( this );
			if ( index >= 0 ) game.round.sprites.splice( index, 1 );

		}
		this.dispatchEvent( "death" );

		// Death antimation
		if ( removeImmediately ) this.remove();
		else {

			this.elem.classList.add( "death" );
			game.round.setTimeout( () => this.remove(), 0.125 );

		}

	}

	remove() {

		this.removeEventListeners();
		if ( game.round ) game.round.pathingMap.removeEntity( this );

		if ( arenaElement.contains( this.elem ) )
			arenaElement.removeChild( this.elem );

	}

} );
