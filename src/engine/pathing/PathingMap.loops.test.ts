import { PathingMap } from "./PathingMap";

const str = (tile: typeof PathingMap.prototype.grid[number][number]) =>
	`x=${tile.x} y=${tile.y}`;

describe("PathingMap#_linearPathable", () => {
	describe("radius=0.5", () => {
		describe("open", () => {
			const pathing = [
				[0, 0, 0],
				[0, 0, 0],
				[0, 0, 0],
			];
			for (let x1 = 0; x1 < 3; x1++)
				for (let x2 = 0; x2 < 3; x2++)
					for (let y1 = 0; y1 < 3; y1++)
						for (let y2 = 0; y2 < 3; y2++) {
							const dx = Math.abs(x2 - x1);
							const dy = Math.abs(y2 - y1);

							if (dx === 0 && dy === 0) continue;

							const pathingMap = new PathingMap({ pathing });
							const entity = {
								collisionRadius: 0.5,
								pathing: 1,
								x: 0,
								y: 0,
							};
							const start = pathingMap.grid[y1][x1];
							const end = pathingMap.grid[y2][x2];

							it(`start=${str(start)}, end=${str(end)}`, () => {
								expect(
									pathingMap._linearPathable(
										entity,
										start,
										end,
									),
								).toBeTruthy();
							});
						}
		});

		describe("blocked", () => {
			const pathing = [
				[0, 0, 0],
				[0, 3, 0],
				[0, 0, 0],
			];
			for (let x1 = 0; x1 < 3; x1++)
				for (let x2 = 0; x2 < 3; x2++)
					for (let y1 = 0; y1 < 3; y1++)
						for (let y2 = 0; y2 < 3; y2++) {
							const dx = Math.abs(x2 - x1);
							const dy = Math.abs(y2 - y1);

							if (dx === 0 && dy === 0) continue;

							const pathingMap = new PathingMap({ pathing });
							const entity = {
								collisionRadius: 0.5,
								pathing: 1,
								x: 0,
								y: 0,
							};
							const start = pathingMap.grid[y1][x1];
							const end = pathingMap.grid[y2][x2];

							it(`start=${str(start)}, end=${str(end)}`, () => {
								expect(
									pathingMap._linearPathable(
										entity,
										start,
										end,
									),
								).toEqual(
									(dx !== 0 && dy !== 0) ||
										(dx && y1 === 1) ||
										(dy && x1 === 1)
										? false
										: true,
								);
							});
						}
		});
	});

	describe("radius=1", () => {
		describe("open", () => {
			const pathing = [
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
			];
			for (let x1 = 1; x1 < 6; x1++)
				for (let x2 = 1; x2 < 6; x2++)
					for (let y1 = 1; y1 < 6; y1++)
						for (let y2 = 1; y2 < 6; y2++) {
							const dx = Math.abs(x2 - x1);
							const dy = Math.abs(y2 - y1);

							if (dx === 0 && dy === 0) continue;

							const pathingMap = new PathingMap({ pathing });
							const entity = {
								collisionRadius: 1,
								pathing: 1,
								x: 0,
								y: 0,
							};
							const start = pathingMap.grid[y1][x1];
							const end = pathingMap.grid[y2][x2];

							it(`start=${str(start)}, end=${str(end)}`, () => {
								expect(
									pathingMap._linearPathable(
										entity,
										start,
										end,
									),
								).toBeTruthy();
							});
						}
		});

		describe("blocked", () => {
			const pathing = [
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 3, 3, 0, 0],
				[0, 0, 3, 3, 0, 0],
				[0, 0, 0, 0, 0, 0],
				[0, 0, 0, 0, 0, 0],
			];
			for (let x1 = 0; x1 < 5; x1++)
				for (let x2 = 0; x2 < 5; x2++)
					for (let y1 = 0; y1 < 5; y1++)
						for (let y2 = 0; y2 < 5; y2++) {
							const dx = Math.abs(x2 - x1);
							const dy = Math.abs(y2 - y1);

							if (dx === 0 && dy === 0) continue;

							const pathingMap = new PathingMap({ pathing });
							const entity = {
								collisionRadius: 1,
								pathing: 1,
								x: 0,
								y: 0,
							};
							const start = pathingMap.grid[y1][x1];
							const end = pathingMap.grid[y2][x2];

							it(`start=${str(start)}, end=${str(end)}`, () => {
								const expected =
									// Start or end in invalid places
									x1 === 0 ||
									x2 === 0 ||
									y1 === 0 ||
									y2 === 0 ||
									(x1 > 1 && x1 < 5 && y1 > 2 && y1 < 5) ||
									(x2 > 1 && x2 < 5 && y2 > 2 && y2 < 5) ||
									// Diagonal movements not possible
									(dx > 0 && dy > 0) ||
									// Doing a monodirectional cross through the middle
									(!dy &&
										dx &&
										((y1 > 1 && y1 < 5) ||
											(y2 > 1 && y2 < 5))) ||
									(!dx &&
										dy &&
										((x1 > 1 && x1 < 5) ||
											(x2 > 1 && x2 < 5)))
										? false
										: true;

								expect(
									pathingMap._linearPathable(
										entity,
										start,
										end,
									),
								).toEqual(expected);
							});
						}
		});
	});
});
