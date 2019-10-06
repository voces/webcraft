
import game from "../index.js";
import { active } from "./obstructionPlacement.js";
import swallow from "../util/swallow.js";

let allSelectables;

const dragSelect = typeof window !== "undefined" ? {} : swallow();

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
			callback: () => {

				if ( allSelectables )
					internalDragSelect.addSelectables( allSelectables );
				allSelectables = undefined;

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
		dragSelect.setSelection = v => internalDragSelect.setSelection( v.map( v => v.elem ? v.elem : v ) );
		dragSelect.addSelectables = v => internalDragSelect.addSelectables( v.map( v => v.elem ? v.elem : v ) );
		dragSelect.removeSelectables = v => internalDragSelect.removeSelectables( v.map( v => v.elem ? v.elem : v ) );

	} )();

export default dragSelect;
