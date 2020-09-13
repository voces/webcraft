import { Unit, UnitProps } from "./Unit";
import { Sprite } from "./Sprite";
import {
	Obstruction,
	Basic,
	Dense,
	Huge,
	Large,
	Resource,
	Slow,
	Stack,
	Tiny,
} from "./obstructions/index";
import { Action } from "./spriteLogic";
import { MeshBuilderComponent } from "../../components/graphics/MeshBuilderComponent";
import { Animation } from "../../components/graphics/Animation";
import { Selected } from "../../components/Selected";
import { Hover } from "../../components/Hover";

const destroyLastBox: Action = {
	name: "Destroy box",
	description: "Destroys selected or last created box",
	hotkey: "x" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		const crosser = player.unit;
		if (!crosser || !Crosser.isCrosser(crosser)) return;
		const obstructions = [...crosser.obstructions];
		while (obstructions.length) {
			const obstruction = obstructions.pop();
			if (obstruction && obstruction.health > 0) {
				player.game.transmit({
					type: "kill",
					sprites: [obstruction.id],
				});
				break;
			}
		}
	},
};

export class Crosser extends Unit {
	static isCrosser = (sprite: Sprite): sprite is Crosser =>
		sprite instanceof Crosser;

	static defaults = {
		...Unit.defaults,
		priority: 1,
		radius: 0.5,
		builds: [Basic, Dense, Huge, Large, Resource, Slow, Stack, Tiny],
	};

	// 380 in WC3 on fast
	speed = 5.9375;
	obstructions: Obstruction[] = [];

	constructor(props: UnitProps) {
		super({ ...Crosser.clonedDefaults, ...props });

		this.addEventListener("death", () => {
			// Kill all their sprites
			[...this.owner.sprites].forEach((sprite) => sprite.kill());

			// Cancel any active placements
			this.game.obstructionPlacement?.stop();
		});
	}

	ascend(): void {
		this.invulnerable = true;
		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}

		// Active components we want to clear right away
		this.stop();
		this.clear(Selected);
		this.clear(Hover);

		this.round.pathingMap.removeEntity(this);
		const index = this.round.sprites.indexOf(this);
		if (index >= 0) this.round.sprites.splice(index, 1);

		// Cancel any active placements
		this.game.obstructionPlacement?.stop();

		const meshBuilderComponent = this.get(MeshBuilderComponent)[0];
		if (meshBuilderComponent) new Animation(this, "ascend", 1);

		this.round.setTimeout(() => this.remove(), 1);
	}

	get actions(): Action[] {
		const actions = super.actions;
		actions.push(destroyLastBox);
		return actions;
	}
}
