
import game from "../index.js";
import { active } from "./obstructionPlacement.js";
import swallow from "../util/swallow.js";
import emitter from "../emitter.js";

let allSelectables;

const dragSelect = typeof window !== "undefined" ?
	emitter( { selection: [] } ) :
	swallow();

if ( typeof window !== "undefined" )

	( async () => {

		const DragSelect = await import( "../lib/DragSelect.js" ).then( i => i.default );

		const internalDragSelect = new DragSelect( {
			onDragStartBegin: () => {

				if ( active() ) return internalDragSelect.break();

			},
			onDragMove: () => {

				if ( allSelectables ) return;
				allSelectables = [ ...internalDragSelect.getSelectables() ];
				const localPlayer = game.localPlayer;
				internalDragSelect.setSelectables( allSelectables.filter( s =>
					s.sprite.owner === localPlayer ) );

			},
			callback: selection => {

				if ( allSelectables )
					internalDragSelect.addSelectables( allSelectables );
				allSelectables = undefined;

				dragSelect.selection = selection.map( e => e.sprite ).filter( Boolean );
				dragSelect.dispatchEvent( "selection", dragSelect.selection );

			},
			onElementSelect: element => {

				const sprite = element.sprite;
				sprite.selected = true;

			},
			onElementUnselect: element => {

				const sprite = element.sprite;
				sprite.selected = false;

			},
		} );

		dragSelect.getSelection = () => internalDragSelect.getSelection().map( e => e.sprite ).filter( Boolean );
		dragSelect.setSelection = v => {

			const elements = v.map( v => v.elem ? v.elem : v );
			const selection = Object.freeze( elements.map( e => e.sprite ).filter( Boolean ) );

			internalDragSelect.setSelection( elements );
			dragSelect.selection = selection;
			dragSelect.dispatchEvent( "selection", selection );

		};
		dragSelect.addSelectables = v => internalDragSelect.addSelectables( v.map( v => v.elem ? v.elem : v ) );
		dragSelect.removeSelectables = v => internalDragSelect.removeSelectables( v.map( v => v.elem ? v.elem : v ) );

	} )();

export default dragSelect;
