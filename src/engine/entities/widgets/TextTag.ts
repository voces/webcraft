import { Mesh, MeshBasicMaterial, PlaneBufferGeometry, Texture } from "three";

import { ThreeObjectComponent } from "../../components/graphics/ThreeObjectComponent";
import { currentGame } from "../../gameContext";
import { Widget, WidgetProps } from "../Widget";

export type TextTagProps = Omit<WidgetProps, "id"> & {
	text: string;
	size?: number;
};

export class TextTag extends Widget {
	readonly speed = 0.1;

	constructor({ size = 12, text, ...props }: TextTagProps) {
		super({ ...props, zOffset: 2 });

		const canvas = this.createCanvasAndContext(text, size);

		const texture = new Texture(canvas);
		texture.needsUpdate = true;
		const material = new MeshBasicMaterial({
			map: texture,
			transparent: true,
		});
		const mesh = new Mesh(
			new PlaneBufferGeometry(canvas.width / 30, canvas.height / 30),
			material,
		);

		new ThreeObjectComponent(this, mesh);

		const game = currentGame();
		game.setTimeout(() => game.remove(this), 1.5);
		game.add(this);
	}

	private createCanvasAndContext(text: string, size: number) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d")!;

		context.font = size + "pt Verdana";
		const width = context.measureText(text).width;
		canvas.setAttribute("width", width + "px");
		canvas.setAttribute("height", size + "px");

		context.textAlign = "center";
		context.textBaseline = "middle";
		context.fillStyle = "red";
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		return canvas;
	}
}
