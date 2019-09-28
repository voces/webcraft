
import DragSelect from "../lib/DragSelect.js";
import game from "../index.js";
import { active } from "./obstructionPlacement.js";

let allSelectables;

const dragSelect = new DragSelect( {
	onDragStartBegin: () => {

		if ( active() ) return dragSelect.break();

	},
	onDragMove: () => {

		if ( allSelectables ) return;
		allSelectables = [ ...dragSelect.getSelectables() ];
		const localPlayer = game.localPlayer;
		dragSelect.setSelectables( allSelectables.filter( s =>
			s.sprite.owner === localPlayer ) );

	},
	callback: () => {

		if ( allSelectables )
			dragSelect.addSelectables( allSelectables );
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

const oldSelection = dragSelect.getSelection;
dragSelect.getSelection = () => oldSelection.call( dragSelect ).map( e => e.sprite );

export default dragSelect;
