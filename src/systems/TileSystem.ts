import { System } from "../core/System.js";
import { Sprite } from "../sprites/Sprite.js";
import { Crosser } from "../sprites/Crosser.js";
import { TILE_TYPES } from "../constants.js";

export class TileSystem extends System<Crosser> {
	static components = [];

	test(entity: Sprite): entity is Crosser {
		return entity instanceof Crosser;
	}

	update(crosser: Crosser): void {
		if (
			crosser.round.arena.tiles[Math.floor(crosser.position.y)][
				Math.floor(crosser.position.x)
			] === TILE_TYPES.END
		) {
			crosser.ascend();
			crosser.round.scores++;
			crosser.owner.unit = undefined;

			crosser.round.onCrosserRemoval();
		}
	}
}
