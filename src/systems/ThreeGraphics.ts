import { System } from "../core/System";
import { document, window } from "../util/globals";
import { Unit } from "../entities/sprites/Unit";
import { MoveTargetManager } from "../components/MoveTarget";
import { Point } from "../pathing/PathingMap";
import { tweenPoints, PathTweener } from "../util/tweenPoints";
import { SceneObjectComponent } from "../components/graphics/SceneObjectComponent";
import { Entity } from "../core/Entity";
import {
	Object3D,
	WebGLRenderer,
	Scene,
	HemisphereLight,
	DirectionalLight,
	Vector3,
	Vector2,
	PerspectiveCamera,
	PCFSoftShadowMap,
} from "three";
import { Position } from "../components/Position";
import { Game } from "../Game";
import { Selected } from "../components/Selected";
import { Hover } from "../components/Hover";
import { isSprite } from "../typeguards";

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
	camera.position.z = 10;
	camera.position.y = -7;
	camera.rotation.x = 0.6;

	return camera;
};

type EntityData = {
	onChangePositionListener?: () => void;
	onHealthChangeListener?: (prop: string) => void;
	updatePosition: boolean;
	updateHealth: boolean;
	knownObject: Object3D;
};

export class ThreeGraphics extends System {
	static components = [SceneObjectComponent];

	static isThreeGraphics = (system: System): system is ThreeGraphics =>
		system instanceof ThreeGraphics;

	protected dirty = new Set<Entity>();
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

		window.addEventListener("resize", () => this.updateSize());
	}

	updateSize(): void {
		const container = this.renderer.domElement.parentElement;
		if (!container) return;

		this.renderer.setSize(container.offsetWidth, container.offsetHeight);

		this.camera.aspect = container.offsetWidth / container.offsetHeight;
		this.camera.updateProjectionMatrix();
	}

	test(entity: Entity): entity is Entity {
		return SceneObjectComponent.has(entity);
	}

	onAddEntity(entity: Entity): void {
		const object = SceneObjectComponent.get(entity)!.object;
		this.scene.add(object);

		// Add listeners
		const data: EntityData = {
			updatePosition: true,
			updateHealth: true,
			knownObject: object,
		};
		if (isSprite(entity)) {
			data.onChangePositionListener = () => {
				this.dirty.add(entity);
				data.updatePosition = true;
			};
			(data.onHealthChangeListener = (prop: string) => {
				if (prop !== "health") return;
				this.dirty.add(entity);
				data.updateHealth = true;
			}),
				entity.position.addEventListener(
					"change",
					data.onChangePositionListener,
				);
			entity.addEventListener("change", data.onHealthChangeListener);
		}
		this.entityData.set(entity, data);
	}

	onRemoveEntity(entity: Entity): void {
		const object = this.entityData.get(entity)?.knownObject;
		if (object) this.scene.remove(object);

		if (isSprite(entity)) {
			const data = this.entityData.get(entity);
			if (data) {
				if (data.onChangePositionListener)
					entity.position.removeEventListener(
						"change",
						data.onChangePositionListener,
					);
				if (data.onHealthChangeListener)
					entity.removeEventListener(
						"change",
						data.onHealthChangeListener,
					);
			}
		}

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

	private updatePosition(
		mesh: Object3D,
		entity: Entity,
		delta: number,
		time: number,
		data: EntityData,
	): boolean {
		let position: Position | undefined;

		let stillDirty = false;

		if (isSprite(entity)) {
			const moveTarget = MoveTargetManager.get(entity);
			if (moveTarget && Unit.isUnit(entity)) {
				moveTarget.renderProgress += entity.speed * delta;
				const { x, y } = moveTarget.path(moveTarget.renderProgress);
				mesh.position.x = x;
				mesh.position.y = y;
				mesh.position.z =
					mesh.position.z * 0.8 +
					entity.game.terrain!.groundHeight(x, y) * 0.2;
				stillDirty = true;
			} else {
				// Otherwise update the rendering position and mark clean
				mesh.position.x = entity.position.x;
				mesh.position.y = entity.position.y;
				mesh.position.z = entity.game.terrain!.groundHeight(
					entity.position.x,
					entity.position.y,
				);
			}
		} else if ((position = Position.get(entity))) {
			mesh.position.x = position.x;
			mesh.position.y = position.y;
			mesh.position.z = this.game.terrain!.groundHeight(
				position.x,
				position.y,
			);
		}

		// TODO: we can probably generalize this with a Children component
		[Selected, Hover].forEach((Circle) => {
			const circle = Circle.get(entity)?.circle;
			if (circle) {
				const object = SceneObjectComponent.get(circle)?.object;
				if (object) object.position.copy(mesh.position);
			}
		});

		if (!stillDirty) data.updatePosition = false;

		return stillDirty;
	}

	// private updateHealth(
	// 	mesh: Object3D,
	// 	entity: Entity,
	// 	data: EntityData,
	// ): boolean {
	// 	// if (entity.health <= 0) elem.classList.add("death");
	// 	// else
	// 	// 	elem.style.opacity = Math.max(
	// 	// 		entity.health / entity.maxHealth,
	// 	// 		0.1,
	// 	// 	).toString();

	// 	// data.updateHealth = false;
	// 	return false;
	// }

	render(entity: Entity, delta: number, time: number): void {
		const object = SceneObjectComponent.get(entity)!.object;
		const data = this.entityData.get(entity);
		if (!data || !object) return;

		const stillDirty = [
			data.updatePosition &&
				this.updatePosition(object, entity, delta, time, data),
			// data.updateHealth && this.updateHealth(object, entity, data),
		].some((v) => v);

		if (!stillDirty) this.dirty.delete(entity);
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
