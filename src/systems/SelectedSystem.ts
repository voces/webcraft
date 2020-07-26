import { System } from "../core/System.js";
import { Sprite } from "../sprites/Sprite.js";
import { Selected } from "../components/Selected.js";
import {
	GraphicComponent,
	GraphicComponentManager,
} from "../components/graphics/GraphicComponent.js";

export class SelectedSystem extends System {
	static components = [Selected, GraphicComponent];

	test(entity: Sprite): entity is Sprite {
		return Selected.has(entity) && GraphicComponentManager.has(entity);
	}

	onAddEntity(entity: Sprite): void {
		const div = GraphicComponentManager.get(entity)?.entityElement;
		if (!div) return;
		div.classList.add("selected");
	}

	onRemoveEntity(entity: Sprite): void {
		const div = GraphicComponentManager.get(entity)?.entityElement;
		if (!div) return;
		div.classList.remove("selected");
	}
}
