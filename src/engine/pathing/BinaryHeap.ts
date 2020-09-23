export class BinaryHeap<T> extends Array<T> {
	scoreFunc: (element: T) => number;

	constructor(scoreFunc: (element: T) => number) {
		super();
		this.scoreFunc = scoreFunc;
	}

	push(element: T): number {
		this.bubbleUp(super.push(element) - 1);

		// todo: return final index?
		return 0;
	}

	pop(): T {
		const top = this[0];
		const bottom = super.pop();

		if (this.length > 0) {
			this[0] = bottom as T;
			this.sinkDown(0);
		}

		return top;
	}

	remove(element: T): void {
		const length = this.length;

		for (let i = 0; i < length; i++) {
			if (this[i] !== element) continue;

			const bottom = super.pop();

			if (i === length - 1) break;

			this[i] = bottom as T;
			this.bubbleUp(i);
			this.sinkDown(i);

			break;
		}
	}

	bubbleUp(index: number): void {
		const element = this[index];
		const score = this.scoreFunc(element);

		while (index > 0) {
			const parentIndex = Math.floor((index + 1) / 2) - 1,
				parent = this[parentIndex];

			if (score >= this.scoreFunc(parent)) break;

			this[parentIndex] = element;
			this[index] = parent;

			index = parentIndex;
		}
	}

	sinkDown(index: number): void {
		const length = this.length;
		const element = this[index];
		const score = this.scoreFunc(element);

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const rightIndex = (index + 1) * 2;
			const leftIndex = rightIndex - 1;
			let leftScore;

			let swapIndex = undefined;

			if (leftIndex < length) {
				const left = this[leftIndex];
				leftScore = this.scoreFunc(left);

				if (leftScore < score) swapIndex = leftIndex;
			}

			if (rightIndex < length) {
				const right = this[rightIndex];

				if (
					this.scoreFunc(right) <
					(swapIndex === undefined ? score : (leftScore as number))
				)
					swapIndex = rightIndex;
			}

			if (swapIndex === undefined) break;

			this[index] = this[swapIndex];
			this[swapIndex] = element;
			index = swapIndex;
		}
	}
}
