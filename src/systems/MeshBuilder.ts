import {
	MeshPhongMaterial,
	Mesh,
	SphereBufferGeometry,
	BoxBufferGeometry,
	Color,
} from "three";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { System } from "../core/System";
import { Sprite } from "../entities/sprites/Sprite";
import { SceneObjectComponent } from "../components/graphics/SceneObjectComponent";
import { EntityMesh } from "../types";

const getColor = (entity: Sprite, graphic: MeshBuilderComponent) => {
	const rawColor =
		graphic.color ?? entity.color ?? entity.owner?.color?.hex ?? "white";
	if (graphic.colorFilter) return graphic.colorFilter(new Color(rawColor));
	return rawColor;
};

const getMat = (entity: Sprite, graphic: MeshBuilderComponent) =>
	new MeshPhongMaterial({
		color: getColor(entity, graphic),
		opacity: graphic.opacity,
		transparent: graphic.opacity < 1,
	});

const createSphere = (entity: Sprite, graphic: MeshBuilderComponent): Mesh => {
	const geometry = new SphereBufferGeometry(entity.radius);
	geometry.translate(0, 0, entity.radius);
	geometry.rotateZ(entity.facing);
	if (graphic.scale)
		geometry.scale(graphic.scale, graphic.scale, graphic.scale);
	return new Mesh(geometry, getMat(entity, graphic));
};
const createBox = (entity: Sprite, graphic: MeshBuilderComponent): Mesh => {
	const geometry = new BoxBufferGeometry(
		entity.radius * 2,
		entity.radius * 2,
		(entity.radius * 3) / 2,
	);
	geometry.translate(0, 0, (entity.radius * 3) / 4);
	geometry.rotateZ(entity.facing);
	if (graphic.scale)
		geometry.scale(graphic.scale, graphic.scale, graphic.scale);
	return new Mesh(geometry, getMat(entity, graphic));
};

type EntityData = {
	onChangePositionListener: () => void;
	onHealthChangeListener: (prop: string) => void;
	updatePosition: boolean;
	updateHealth: boolean;
};

export class MeshBuilder extends System {
	static components = [MeshBuilderComponent];

	static isMeshBuilder = (system: System): system is MeshBuilder =>
		system instanceof MeshBuilder;

	protected dirty = new Set<Sprite>();
	private entityData: Map<Sprite, EntityData> = new Map();

	test(entity: Sprite): entity is Sprite {
		return MeshBuilderComponent.has(entity);
	}

	onAddEntity(entity: Sprite): void {
		const graphic = entity.get(MeshBuilderComponent)[0];
		if (!graphic) return;

		// Build/set the mesh
		const builder = graphic.shape === "circle" ? createSphere : createBox;
		const mesh: EntityMesh = builder(entity, graphic);
		if (graphic.shadows) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		mesh.position.x = entity.position.x;
		mesh.position.y = entity.position.y;
		mesh.position.z = entity.radius;
		mesh.entity = entity;

		// Add listeners
		const data = {
			onChangePositionListener: () => {
				this.dirty.add(entity);
				data.updatePosition = true;
			},
			onHealthChangeListener: (prop: string) => {
				if (prop !== "health") return;
				this.dirty.add(entity);
				data.updateHealth = true;
			},
			updatePosition: true,
			updateHealth: true,
		};
		entity.position.addEventListener(
			"change",
			data.onChangePositionListener,
		);
		entity.addEventListener("change", data.onHealthChangeListener);
		this.entityData.set(entity, data);

		// Attach the mesh to the entity
		new SceneObjectComponent(entity, mesh);
	}

	onRemoveEntity(entity: Sprite): void {
		const data = this.entityData.get(entity);
		if (data) {
			entity.position.removeEventListener(
				"change",
				data.onChangePositionListener,
			);
			entity.removeEventListener("change", data.onHealthChangeListener);
		}

		this.entityData.delete(entity);

		SceneObjectComponent.clear(entity);
	}
}
