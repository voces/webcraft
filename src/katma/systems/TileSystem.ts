import { System } from "../../core/System";
import { Sprite } from "../../entities/sprites/Sprite";
import { Crosser } from "../../entities/sprites/Crosser";
import { TILE_TYPES } from "../../engine/constants";
import { currentRound } from "../roundContext";

export class TileSystem extends System<Crosser> {
	static components = [];

	test(entity: Sprite): entity is Crosser {
		return entity instanceof Crosser;
	}

	update(crosser: Crosser): void {
		const round = currentRound();
		if (
			round.arena.tiles[
				round.arena.tiles.length - Math.ceil(crosser.position.y)
			][Math.floor(crosser.position.x)] === TILE_TYPES.END
		) {
			crosser.ascend();
			round.scores++;
			crosser.owner.unit = undefined;

			round.onCrosserRemoval();
		}
	}
}
