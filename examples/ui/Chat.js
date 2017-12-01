
import { isBrowser } from "../../src/webcraft.js";

let chat;

export default app => {

	if ( ! isBrowser || chat ) return;

	class Chat extends HTMLElement {

		connectedCallback() {

			const shadowRoot = this.attachShadow( { mode: "open" } );
			shadowRoot.innerHTML = /* @html */`
				<style>
				:host {
					width: calc( 10em + 40% );
					max-width: 60%;
					position: absolute;
					bottom: 1em;
					left: 1em;
					color: white;
					display: block;
				}
				#log .chat {
					padding-left: 1em;
					text-indent: -1em;
					margin: 0.125em 0;
					opacity: 1;
					transition: opacity 2s ease;
				}
				#log .chat.fade { opacity: 0; }
				:host(:focus-within) #log .chat.fade { opacity: 1; }
				#log .chat.system { color: #4fafef; }
				input {
					display: block;
					color: inherit;
					font-family: inherit;
					font-size: inherit;
					background-color: rgba( 63, 63, 63, 0.25 );
					border: 1px solid rgba( 63, 63, 63, 0.25 );
					width: 100%;
					outline: none;
					padding: 0.25em 0.25em 0em;
				}
				input:focus {
					border: 1px solid rgba( 91, 91, 91, 0.33 );
					background-color: rgba( 63, 63, 63, 0.33 );
				}

				</style>
				<div id="log"></div>
				<input id="input" placeholder="Press enter to begin chatting."></input>`;

			const ids = shadowRoot.querySelectorAll( "[id]" );
			for ( let i = 0; i < ids.length; i ++ )
				this[ ids[ i ].id ] = ids[ i ];

			this.input.addEventListener( "keydown", e => {

				if ( e.key !== "Enter" ) return;

				e.stopPropagation();

				if ( this.input.value.trim().length === 0 ) {

					this.input.value = "";
					this.input.blur();
					return;

				}

				app.network.send( { type: "chat", message: this.input.value.trimLeft().slice( 0, 300 ).trimRight() } );
				this.input.value = "";

			} );

			this.input.addEventListener( "focus", function inputFocused() {

				this.removeEventListener( "focus", inputFocused );
				this.removeAttribute( "placeholder" );

			} );

		}

		appendChat( message, who ) {

			const chat = document.createElement( "div" );
			chat.classList.add( "chat" );
			if ( who === "system" ) {

				chat.classList.add( "system" );
				chat.innerHTML = /* @html */`<span class="message">${message}</span>`;

			} else if ( who ) {

				chat.innerHTML = /* @html */`<span class="who" style="color: ${who.color.hex}">${who.color.name}</span>: <span class="message">${message}</span>`;

			}

			this.log.appendChild( chat );

			setTimeout( () => chat.classList.add( "fade" ), 5000 + message.length * 100 );
			setTimeout( () => chat.remove(), 50000 + message.length * 1000 );

		}

	}

	customElements.define( "wc-ui-chat", Chat );

	chat = new Chat();
	document.body.appendChild( chat );

	app.addEventListener( "chat", e => chat.appendChat( e.message.slice( 0, 300 ), e.player ) );

	window.addEventListener( "keydown", e => {

		if ( e.key !== "Enter" || document.activeElement === chat ) return;
		chat.input.focus();
		e.stopPropagation();

	} );

};
