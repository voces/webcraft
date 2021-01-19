import {
	CanvasTexture,
	Mesh,
	MeshBasicMaterial,
	PlaneBufferGeometry,
} from "three";

import { document, window } from "../../../core/util/globals";
import { ThreeObjectComponent } from "../../components/graphics/ThreeObjectComponent";
import { currentGame } from "../../gameContext";
import { Widget, WidgetProps } from "../Widget";

const TEXT_OVERSIZE = 10;
const TEXT_SCALE = 40 * TEXT_OVERSIZE;

const createCanvasAndContext = (text: string, size: number, color: string) => {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d")!;
	context.scale(window.devicePixelRatio, window.devicePixelRatio);

	const height = size * TEXT_OVERSIZE;
	context.font = size * TEXT_OVERSIZE + "pt Verdana";
	const width = context.measureText(text).width;

	canvas.width = width * window.devicePixelRatio;
	canvas.height = height * window.devicePixelRatio;

	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = size * TEXT_OVERSIZE + "pt Verdana";

	// Top-left shadow
	context.fillStyle = "black";
	context.fillText(
		text,
		canvas.width / 2 - TEXT_OVERSIZE / 6,
		canvas.height / 2 - TEXT_OVERSIZE / 6,
	);

	// Bottom-right shadow
	context.fillStyle = "black";
	context.fillText(
		text,
		canvas.width / 2 + TEXT_OVERSIZE / 3,
		canvas.height / 2 + TEXT_OVERSIZE / 2,
	);

	context.fillStyle = color;
	context.fillText(text, canvas.width / 2, canvas.height / 2);

	return canvas;
};

export type TextTagProps = Omit<WidgetProps, "id"> & {
	text: string;
	size?: number;
	color?: string;
};

export class TextTag extends Widget {
	readonly speed = 0.1;

	constructor({ size = 12, text, color = "white", ...props }: TextTagProps) {
		super({ ...props, zOffset: 0.5 });

		const canvas = createCanvasAndContext(text, size, color);

		const texture = new CanvasTexture(canvas);
		const material = new MeshBasicMaterial({
			map: texture,
			alphaTest: 0.5,
			depthTest: false,
		});
		const mesh = new Mesh(
			new PlaneBufferGeometry(
				canvas.width / TEXT_SCALE,
				canvas.height / TEXT_SCALE,
			),
			material,
		);
		mesh.renderOrder = 0;

		new ThreeObjectComponent(this, mesh);

		const game = currentGame();
		game.setTimeout(() => game.remove(this), 1.5);
		game.add(this);
	}
}
