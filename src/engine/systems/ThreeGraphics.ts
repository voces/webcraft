import type { Object3D } from "three";
import {
	DirectionalLight,
	HemisphereLight,
	PCFSoftShadowMap,
	PerspectiveCamera,
	Scene,
	Vector2,
	Vector3,
	WebGLRenderer,
} from "three";

import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { document, localStorage, window } from "../../core/util/globals";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import type { Game } from "../Game";
import type { Point } from "../pathing/PathingMap";
import type { PathTweener } from "../util/tweenPoints";
import { tweenPoints } from "../util/tweenPoints";

const getCanvas = () => {
	const canvas = document.createElement("canvas");
	document.body.prepend(canvas);

	return canvas;
};

const getRenderer = (canvas: HTMLCanvasElement) => {
	const renderer = new WebGLRenderer({
		antialias: window.devicePixelRatio > 1 ? false : true,
		canvas,
	});
	// renderer.gammaOutput = true;
	renderer.setClearColor(0x000000);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	if (!renderer.domElement.parentElement)
		document.body.prepend(renderer.domElement);

	return renderer;
};

const sunTilt = new Vector3(-10, -15, 25);
const updateLight = (
	camera: PerspectiveCamera,
	sun: DirectionalLight,
	container?: HTMLElement,
) => {
	sun.position.copy(camera.position).add(sunTilt);
	const height = sun.position.z;
	sun.shadow.camera.near = 0;
	sun.shadow.camera.far = height * 5 + 100;

	sun.shadow.camera.left = -height * 1;
	sun.shadow.camera.right = height * 0.6;
	sun.shadow.camera.top = height * 1;
	sun.shadow.camera.bottom = -height * 0.4;

	if (container) {
		sun.shadow.mapSize.width =
			2 ** Math.floor(Math.log2(container.offsetWidth));
		sun.shadow.mapSize.height =
			2 ** Math.floor(Math.log2(container.offsetHeight));
	}
};

const getScene = (camera: PerspectiveCamera, container?: HTMLElement) => {
	const scene = new Scene();

	// Basic lighting
	scene.add(new HemisphereLight(0xffffbb, 0x080820, 1));

	// Sun
	const sun = new DirectionalLight(0xffffff, 1);
	sun.target = camera;
	updateLight(camera, sun, container);
	sun.castShadow = true;
	scene.add(sun);

	return { scene, sun };
};

const getCamera = (renderer: WebGLRenderer) => {
	const size = new Vector2();
	renderer.getSize(size);
	const camera = new PerspectiveCamera(75, size.x / size.y, 0.1, 10000);
	camera.position.z = parseFloat(localStorage.getItem("zoom") ?? "10");
	camera.position.y = -7;
	camera.rotation.x = 0.6;

	return camera;
};

type EntityData = { knownObject: Object3D };

export class ThreeGraphics extends System {
	static components = [ThreeObjectComponent];
	readonly pure = true;

	private entityData: Map<Entity, EntityData> = new Map();
	private renderer: WebGLRenderer;
	private scene: Scene;
	private sun: DirectionalLight;

	private game: Game;

	// This should ideally be an entity...
	camera: PerspectiveCamera;

	private activePan?: PathTweener & { duration: number };

	constructor(game: Game) {
		super();
		this.game = game;

		const canvas = getCanvas();
		this.renderer = getRenderer(canvas);
		this.camera = getCamera(this.renderer);
		const { scene, sun } = getScene(
			this.camera,
			this.renderer.domElement.parentElement ?? undefined,
		);
		this.scene = scene;
		this.sun = sun;

		// helps with camera -> renderer -> updateSize -> camera
		(async () => this.updateSize())();

		window.addEventListener("resize", () => {
			this.updateSize();
			this.updateCamera();
		});
	}

	updateSize(): void {
		const container = this.renderer.domElement.parentElement;
		if (!container) return;

		this.renderer.setSize(container.offsetWidth, container.offsetHeight);

		this.camera.aspect = container.offsetWidth / container.offsetHeight;
		this.camera.updateProjectionMatrix();
	}

	test(entity: Entity): entity is Entity {
		return ThreeObjectComponent.has(entity);
	}

	onAddEntity(entity: Entity): void {
		const object = entity.get(ThreeObjectComponent)[0]!.object;
		this.scene.add(object);

		// Add listeners
		const data: EntityData = { knownObject: object };
		this.entityData.set(entity, data);
	}

	onRemoveEntity(entity: Entity): void {
		const object = this.entityData.get(entity)?.knownObject;
		if (object) this.scene.remove(object);

		this.entityData.delete(entity);
	}

	panTo(point: Point, duration = 0.125): void {
		this.activePan = Object.assign(
			tweenPoints([
				{ x: this.camera.position.x, y: this.camera.position.y },
				{ x: point.x, y: point.y - 7 },
			]),
			{ duration },
		);
		this.updateCamera();
	}

	private updateCamera(delta = 17 / 1000): void {
		const activePan = this.activePan;
		if (activePan) {
			const { x, y } = activePan.step(
				(delta * activePan.distance) / activePan.duration,
			);
			this.camera.position.x = x;
			this.camera.position.y = y;
			updateLight(
				this.camera,
				this.sun,
				this.renderer.domElement.parentElement ?? undefined,
			);
			if (activePan.remaining === 0) this.activePan = undefined;
		}
	}

	postRender(delta: number): void {
		this.updateCamera(delta);
		this.renderer.render(this.scene, this.camera);
	}
}
