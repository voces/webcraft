import BinaryHeap from "./BinaryHeap.js";

describe("BinaryHeap#constructor", () => {
	it("sets params", () => {
		const fn = () => 0;

		const heap = new BinaryHeap(fn);

		expect(heap.scoreFunc).toBe(fn);
	});
});

describe("BinaryHeap#push", () => {
	it("appends child", () => {
		const heap = new BinaryHeap<{ id: number }>(() => 0);
		const element1 = { id: 1 };
		const element2 = { id: 2 };
		heap.push(element1);
		heap.push(element2);

		expect([...heap]).toEqual([element1, element2]);
	});
});

describe("BinaryHeap#pop", () => {
	it("removes first element and elevates chain", () => {
		const heap = new BinaryHeap<{ id: number }>(() => 0);
		const element1 = { id: 1 };
		const element2 = { id: 2 };
		heap.push(element1);
		heap.push(element2);
		heap.pop();

		expect([...heap]).toEqual([element2]);
	});
});

describe("BinaryHeap#remove", () => {
	it("removes passed element", () => {
		const heap = new BinaryHeap<number>((n) => n);
		heap.push(3);
		heap.push(1);
		heap.push(2);
		heap.remove(1);

		expect([...heap]).toEqual([2, 3]);
	});
});

describe("BinaryHeap#bubbleUp", () => {
	it("moves an element up to its proper heap order", () => {
		const heap = new BinaryHeap<number>((n) => n);
		for (let i = 20; i > 0; i--) heap.push(i);

		expect([...heap]).toEqual([
			1,
			2,
			7,
			4,
			3,
			10,
			8,
			11,
			5,
			12,
			13,
			19,
			15,
			16,
			9,
			20,
			14,
			17,
			6,
			18,
		]);

		const index = heap.length;
		heap[index] = 0;
		heap.bubbleUp(index);

		expect([...heap]).toEqual([
			0,
			1,
			7,
			4,
			2,
			10,
			8,
			11,
			5,
			3,
			13,
			19,
			15,
			16,
			9,
			20,
			14,
			17,
			6,
			18,
			12,
		]);
	});
});

describe("BinaryHeap#sinkDown", () => {
	it("moves an element down to its proper heap order", () => {
		const heap = new BinaryHeap<number>((n) => n);
		for (let i = 19; i >= 0; i--) heap.push(i);

		expect([...heap]).toEqual([
			0,
			1,
			6,
			3,
			2,
			9,
			7,
			10,
			4,
			11,
			12,
			18,
			14,
			15,
			8,
			19,
			13,
			16,
			5,
			17,
		]);

		heap.unshift(20);
		heap.sinkDown(0);

		expect([...heap]).toEqual([
			0,
			3,
			1,
			6,
			4,
			2,
			9,
			7,
			10,
			5,
			11,
			12,
			18,
			14,
			15,
			8,
			19,
			13,
			16,
			20,
			17,
		]);
	});
});
