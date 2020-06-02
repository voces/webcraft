
import { hotkeys, Hotkey } from "../sprites/spriteLogic.js";
import { document } from "../util/globals.js";
import dragSelect from "../sprites/dragSelect.js";
import { defined } from "../types.js";

const container = document.getElementById( "hotkeys" )!;

const qwertySort = "qwertyuiopasdfghjklzxcvbnm".split( "" );
const entries = Object.entries( hotkeys );
const sortedHotkeys = qwertySort
	.map( k => entries.find( ( [ key ] ) => key === k ) )
	.filter( defined );
const hotkeyIcons: [Hotkey, HTMLDivElement][] = [];
sortedHotkeys.forEach( ( [ hotkey, spec ] ) => {

	const charCode = hotkey.charCodeAt( 0 );
	// Only sure a-z
	if ( hotkey.length > 1 || charCode < 97 || charCode > 122 ) return;

	const elem = document.createElement( "div" );
	elem.classList.add( "hotkey" );
	if ( typeof spec !== "function" && spec.activeWhen )
		hotkeyIcons.push( [ spec, elem ] );

	const key = document.createElement( "span" );
	key.classList.add( "key" );
	key.textContent = hotkey.toUpperCase();
	elem.appendChild( key );

	const tooltip = document.createElement( "div" );
	tooltip.classList.add( "tooltip" );

	const title = document.createElement( "div" );
	title.classList.add( "title" );
	const hotkeyIndex = spec.name.toLowerCase().indexOf( hotkey );
	const casedHotkey = hotkeyIndex >= 0 ? spec.name[ hotkeyIndex ] : hotkey.toUpperCase();
	const highlight = `<span class="highlight">${casedHotkey}</span>`;
	title.innerHTML = hotkeyIndex >= 0 ?
		spec.name.slice( 0, hotkeyIndex ) + highlight + spec.name.slice( hotkeyIndex + 1 ) :
		spec.name + ` (${highlight})`;
	tooltip.appendChild( title );

	const description = document.createElement( "div" );
	description.classList.add( "description" );
	if ( typeof spec !== "function" && spec.description )
		description.textContent = spec.description;
	tooltip.appendChild( description );

	elem.appendChild( tooltip );

	container.appendChild( elem );

} );

const toggleHotkeyIcons = () =>
	hotkeyIcons.forEach( ( [ hotkey, elem ] ) =>
		elem.style.display = typeof hotkey !== "function" && hotkey.activeWhen() ? "" : "none" );

setTimeout( toggleHotkeyIcons );

dragSelect.addEventListener( "selection", () => toggleHotkeyIcons() );
