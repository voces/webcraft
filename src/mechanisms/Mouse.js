
import Merchanism from "../Merchanism.js";

const BUTTONS = [
	"left",
	"wheel",
	"right",
	"back",
	"forward"
];

export default class Keyboard extends Merchanism {

	buttons = undefined; // A whitelist of buttons to listen to; undefined means all
	state = {} // Memory of which (local) buttons are currently down

	constructor( { events = [ "mousedown", "mouseup" ] } = {} ) {

		super();

		// Make sure we have a window object (browser-only)
		if ( ! window ) return;

		if ( events.includes( "mousedown" ) )
			window.addEventListener( "mousedown", e => {

				const button = BUTTONS[ e.button ];
				if ( this.state[ button ] &&
                    this.state[ button ].x === e.clientX &&
                    this.state[ button ].y === e.clientY )
					return;
				const detail = { x: e.clientX, y: e.clientY };
				this.state[ button ] = detail;
				this.state.x = e.clientX;
				this.state.y = e.clientY;
				this.dispatchEvent( "mousedown", { button, ...detail } );

			} );

		if ( events.includes( "mouseup" ) )
			window.addEventListener( "mouseup", e => {

				const button = BUTTONS[ e.button ];
				if ( ! this.state[ button ] ) return;
				delete this.state[ button ];
				this.state.x = e.clientX;
				this.state.y = e.clientY;
				this.dispatchEvent( "mouseup", { button, x: e.clientX, y: e.clientY } );

			} );

		if ( events.includes( "mousemove" ) )
			window.addEventListener( "mousemove", e => {

				if ( this.state.x === e.clientX && this.state.y === e.clientY ) return;
				this.state.x = e.clientX;
				this.state.y = e.clientY;
				this.dispatchEvent( "mousemove", { x: e.clientX, y: e.clientY } );

			} );

		if ( events.includes( "wheel" ) )
			// TODO: figure out how to stop the entire <body> from moving
			window.addEventListener( "wheel", e => {

				this.state.x = e.clientX;
				this.state.y = e.clientY;

				this.dispatchEvent( "wheel", {
					deltaX: e.deltaX,
					deltaY: e.deltaY,
					deltaZ: e.deltaZ,
					x: e.clientX,
					y: e.clientY
				} );

			} );

		// const oldDispatchEvent = this.dispatchEvent.bind( this );
		// this.dispatchEvent = ( ...args ) => {

		// 	console.log( ...args );
		// 	oldDispatchEvent( ...args );

		// };

	}

	get attachments() {

		const attachments = {
			mouse: this.state
		};

		Object.defineProperty( this, "attachments", { value: attachments } );

		return attachments;

	}

}

