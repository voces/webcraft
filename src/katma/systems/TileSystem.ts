import { System } from "../../core/System";
import { TILE_TYPES } from "../../engine/constants";
import { Sprite } from "../../engine/entities/widgets/Sprite";
import { Crosser } from "../entities/Crosser";
import { currentRound } from "../roundContext";

export class TileSystem extends System<Crosser> {
	static components = [];

	test(entity: Sprite): entity is Crosser {
		return entity instanceof Crosser;
	}

	update(crosser: Crosser): void {
		if (crosser.invulnerable) return;
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
