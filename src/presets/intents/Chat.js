
import { isBrowser } from "../../misc/env.js";

class Chat {

	constructor( app ) {

		this.app = app;

		if ( ! isBrowser ) return;

		this._elementConstructor();

		window.addEventListener( "keydown", e => {

			if ( e.key === "Enter" ) e.stopPropagation();
			else return;

			if ( document.activeElement === this.input ) {

				if ( this.input.value.length === 0 ) {

					this.input.blur();
					return;

				}

				app.network.send( { type: "chat", message: this.input.value } );

				this.input.value = "";

				return;

			} else this.input.focus();

		} );

		app.addEventListener( "chat", e => this.appendChat( e.message, e.player ) );

	}

	appendChat( message, who ) {

		const scrollBottom = this.history.parentElement ? Math.abs( this.history.parentElement.scrollHeight - this.history.parentElement.clientHeight - this.history.parentElement.scrollTop ) < 2 : false;

		const chat = document.createElement( "div" );
		chat.classList.add( "chat" );

		if ( who === "system" ) chat.classList.add( "system" );
		else if ( who ) {

			const player = document.createElement( "span" );
			player.textContent = who.color.name;
			player.style.color = who.color.hex;
			chat.appendChild( player );

			chat.appendChild( document.createTextNode( ": " ) );

		}

		const messageSpan = document.createElement( "span" );
		messageSpan.textContent = message;
		chat.appendChild( messageSpan );

		this.history.appendChild( chat );

		if ( scrollBottom )
			this.history.parentElement.scrollTop = this.history.parentElement.scrollHeight - this.history.parentElement.clientHeight;

	}

	_elementConstructor() {

		this.chat = document.createElement( "div" );
		this.chat.classList.add( "wc", "ui", "chat" );

		const historyContainer = document.createElement( "div" );
		historyContainer.classList.add( "history-container" );
		this.chat.appendChild( historyContainer );

		this.history = document.createElement( "div" );
		this.history.classList.add( "history" );

		historyContainer.appendChild( this.history );

		this.input = document.createElement( "input" );
		this.input.type = "text";
		this.chat.appendChild( this.input );

		document.body.appendChild( this.chat );

		const style = document.createElement( "style" );
		document.body.appendChild( style );

		const rules = [
			`.wc.ui.chat {
				position: absolute;
				bottom: 1em;
				left: 1em;
				width: calc( 10em + 10% );
				max-width: calc( 40% );
				max-height: calc( 50% );
				color: white;
				z-index: 1;
				display: flex;
				flex-flow: column;
				-webkit-mask-image: -webkit-gradient( linear, left top, left bottom, from( rgba( 0, 0, 0, 0 ) ), to( rgba( 0, 0, 0, 1 ) ) );
			}`,
			".wc.ui.chat:hover { -webkit-mask-image: none; }",
			`.wc.ui.chat .history-container {
				overflow: auto;
				background-color: rgba( 63, 63, 63, 0 );
				border: 1px solid rgba( 91, 91, 91, 0.25 );
			}`,
			`.wc.ui.chat .history-container:hover {
				background-color: rgba( 63, 63, 63, 0.25 );
				transition: background-color 0.8s ease;
			}`,
			".wc.ui.chat .history-container::-webkit-scrollbar { width: 0.5em; }",
			".wc.ui.chat .history-container::-webkit-scrollbar-track { background-color: rgba( 63, 63, 63, 0.25 ); }",
			".wc.ui.chat .history-container::-webkit-scrollbar-thumb { background-color: inherit; }",
			`.wc.ui.chat .history {
				background-color: rgba( 63, 63, 63, 0.25 );
				transition: background-color 0.8s ease;
				padding: 0.25em 0.5em;
			}`,
			".wc.ui.chat .history:hover { background-color: rgba( 63, 63, 63, 0 ); }",
			`.wc.ui.chat .history .chat {
				padding-left: 1em;
				text-indent: -1em;
				margin: 0.125em 0;
			}`,
			".wc.ui.chat .history .chat.system { color: 4fafef; }",
			`.wc.ui.chat input {
				display: block;
				width: 100%;
				background-color: rgba( 63, 63, 63, 0.25 );
				color: inherit;
				border: 1px solid rgba( 63, 63, 63, 0.25 );
				outline: none;
				padding: 0.25em 0.5em;
				font-family: inherit;
				font-size: inherit;
			}`,
			`.wc.ui.chat input:focus {
				border: 1px solid rgba( 91, 91, 91, 0.33 );
				background-color: rgba( 63, 63, 63, 0.33 );
			}`
		];

		for ( let i = 0; i < rules.length; i ++ )
			style.sheet.insertRule( rules[ i ], style.sheet.cssRules.length );

		for ( let i = 0; i < 30; i ++ ) this.appendChat( i, "system" );

	}

}

export default Chat;
