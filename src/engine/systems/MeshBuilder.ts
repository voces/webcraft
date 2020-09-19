import {
	MeshPhongMaterial,
	Mesh,
	SphereBufferGeometry,
	BoxBufferGeometry,
	Color,
} from "three";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { System } from "../../core/System";
import { Sprite } from "../../entities/sprites/Sprite";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { EntityMesh } from "../types";

const getColor = (entity: Sprite, meshBuilder: MeshBuilderComponent) => {
	const rawColor =
		meshBuilder.color ??
		entity.color ??
		entity.owner?.color?.hex ??
		"white";
	if (meshBuilder.colorFilter)
		return meshBuilder.colorFilter(new Color(rawColor));
	return rawColor;
};

const getMat = (entity: Sprite, meshBuilder: MeshBuilderComponent) =>
	new MeshPhongMaterial({
		color: getColor(entity, meshBuilder),
		opacity: meshBuilder.opacity,
		transparent: meshBuilder.opacity < 1,
	});

const createSphere = (
	entity: Sprite,
	meshBuilder: MeshBuilderComponent,
): Mesh => {
	const geometry = new SphereBufferGeometry(meshBuilder.scale);
	geometry.translate(0, 0, meshBuilder.scale);
	return new Mesh(geometry, getMat(entity, meshBuilder));
};
const createBox = (entity: Sprite, meshBuilder: MeshBuilderComponent): Mesh => {
	const geometry = new BoxBufferGeometry(
		meshBuilder.scale * 2,
		meshBuilder.scale * 2,
		(meshBuilder.scale * 3) / 2,
	);
	geometry.translate(0, 0, (meshBuilder.scale * 3) / 4);
	geometry.rotateZ(entity.facing);
	return new Mesh(geometry, getMat(entity, meshBuilder));
};

export class MeshBuilder extends System {
	static components = [MeshBuilderComponent];

	static isMeshBuilder = (system: System): system is MeshBuilder =>
		system instanceof MeshBuilder;

	test(entity: Sprite): entity is Sprite {
		return MeshBuilderComponent.has(entity);
	}

	onAddEntity(entity: Sprite): void {
		const meshBuilder = entity.get(MeshBuilderComponent)[0];
		if (!meshBuilder) return;

		// Build/set the mesh
		const builder =
			meshBuilder.shape === "circle" ? createSphere : createBox;
		const mesh: EntityMesh = builder(entity, meshBuilder);
		if (meshBuilder.shadows) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		mesh.position.x = entity.position.x;
		mesh.position.y = entity.position.y;
		// mesh.position.z = ;
		mesh.entity = entity;

		// Attach the mesh to the entity
		new ThreeObjectComponent(entity, mesh);
	}

	onRemoveEntity(entity: Sprite): void {
		ThreeObjectComponent.clear(entity);
	}
}
