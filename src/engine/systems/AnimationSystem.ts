import { System } from "../../core/System";
import { Sprite } from "../../entities/sprites/Sprite";
import { Animation } from "../components/graphics/Animation";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";

export class AnimationSystem extends System<Sprite> {
	static components = [Animation];
	private entityData = new Map<Sprite, { animation: Animation }>();

	test(entity: Sprite): entity is Sprite {
		return Animation.has(entity) && MeshBuilderComponent.has(entity);
	}

	onAddEntity(entity: Sprite): void {
		const animation = entity.get(Animation)[0];
		if (!animation) return this.remove(entity);

		this.entityData.set(entity, { animation });
	}

	onRemoveEntity(entity: Sprite): void {
		const data = this.entityData.get(entity);
		if (!data) return;
	}
}
