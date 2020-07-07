import { document } from "../util/globals.js";
import { System } from "../core/System.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { Sprite } from "../sprites/Sprite.js";

// TODO: abstract dom into a class
const arenaElement = document.getElementById("arena")!;

export type HTMLComponent = {
	htmlElement?: EntityElement;
} & (
	| {
			generator: () => EntityElement;
	  }
	| {
			shape: "square" | "circle";
	  }
);

type HTMLEntity = Sprite & {
	html: HTMLComponent;
};

export type EntityElement = HTMLDivElement & { sprite: HTMLEntity };

class HTMLGraphics extends System<HTMLEntity> {
	test(entity: Sprite): entity is HTMLEntity {
		return !!entity.html;
	}

	onAddEntity(entity: HTMLEntity): void {
		// Create a div if no htmlElement (only do this once!)
		if (!entity.html.htmlElement) {
			const div = Object.assign(document.createElement("div"), {
				sprite: entity,
			});
			entity.html.htmlElement = div;
		}

		// We should have one, now!
		const elem = entity.html.htmlElement!;

		elem.classList.add(this.constructor.name.toLowerCase(), "sprite");
		elem.style.left =
			(entity.x - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
		elem.style.top =
			(entity.y - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
		elem.style.width = entity.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		elem.style.height = entity.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";

		if (entity.owner) {
			if (!entity.color && entity.owner.color)
				elem.style.backgroundColor = entity.owner.color.hex;
			elem.setAttribute("owner", entity.owner.id.toString());
		} else elem.style.backgroundColor = entity.color ?? "white";

		arenaElement.appendChild(elem);
	}
}

export { HTMLGraphics };
