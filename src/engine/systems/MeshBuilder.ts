import {
	AnimationClip,
	BooleanKeyframeTrack,
	BoxBufferGeometry,
	Color,
	Mesh,
	MeshPhongMaterial,
	NumberKeyframeTrack,
	SphereBufferGeometry,
	VectorKeyframeTrack,
} from "three";

import { System } from "../../core/System";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import type { Sprite } from "../entities/widgets/Sprite";
import type { EntityMesh } from "../types";

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
	readonly pure = true;

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
		meshBuilder.mutator?.(mesh);
		mesh.entity = entity;

		mesh.animations.push(
			new AnimationClip("attack", 0.75, [
				new VectorKeyframeTrack(
					".scale",
					[0, 0.35, 0.5, 0.75],
					[1, 1, 1, 1.25, 1.25, 1.25, 0.8, 0.8, 0.8, 1, 1, 1],
				),
			]),
			new AnimationClip("cast", 0.5, [
				new VectorKeyframeTrack(
					".scale",
					[0, 0.25, 0.35, 0.5],
					[1, 1, 1, 0.8, 0.8, 0.8, 1.25, 1.25, 1.25, 1, 1, 1],
				),
			]),
			new AnimationClip("explode", 0.25, [
				new VectorKeyframeTrack(
					".scale",
					[0, 0.25],
					[1, 1, 1, 5, 5, 5],
				),
				new NumberKeyframeTrack(".material.opacity", [0, 0.25], [1, 0]),
				new BooleanKeyframeTrack(".material.transparent", [0], [true]),
			]),
		);

		// Attach the mesh to the entity
		new ThreeObjectComponent(entity, mesh);
	}

	onRemoveEntity(entity: Sprite): void {
		ThreeObjectComponent.clear(entity);
	}
}
