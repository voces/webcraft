// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Reformatted and swapped functions with lambdas, but otherwise the same

export interface AleaState {
	c: number;
	s0: number;
	s1: number;
	s2: number;
}

interface AleaData extends AleaState {
	next: {
		(): number;
		int32?: () => number;
		double?: () => number;
		quick?: () => number;
		state?: () => AleaState;
	};
}

function _alea(seed: string) {
	const mash = Mash();

	// Apply the seeding algorithm from Baagoe.
	const data: AleaData = {
		c: 1,
		s0: mash(" "),
		s1: mash(" "),
		s2: mash(" "),
		next: (): number => {
			const t = 2091639 * data.s0 + data.c * 2.3283064365386963e-10; // 2^-32
			data.s0 = data.s1;
			data.s1 = data.s2;

			return (data.s2 = t - (data.c = t | 0));
		},
	};

	data.s0 -= mash(seed);
	if (data.s0 < 0) data.s0 += 1;

	data.s1 -= mash(seed);
	if (data.s1 < 0) data.s1 += 1;

	data.s2 -= mash(seed);
	if (data.s2 < 0) data.s2 += 1;

	return data;
}

function copy(f: AleaState, t: AleaState) {
	t.c = f.c;
	t.s0 = f.s0;
	t.s1 = f.s1;
	t.s2 = f.s2;

	return t;
}

export function alea(
	seed: string,
	opts?: { state: AleaState },
): AleaData["next"] {
	const xg = _alea(seed);
	const state = opts?.state;
	const prng = xg.next;

	prng.int32 = () => (xg.next() * 0x100000000) | 0;
	prng.double = () =>
		prng() + ((prng() * 0x200000) | 0) * 1.1102230246251565e-16; // 2^-53;
	prng.quick = prng;

	if (state) {
		if (typeof state === "object") copy(state, xg);

		prng.state = () => copy(xg, { c: 0, s0: 0, s1: 0, s2: 0 });
	}

	return prng;
}

function Mash() {
	let n = 0xefc8249d;

	const mash = (data: string) => {
		for (let i = 0; i < data.length; i++) {
			n += data.charCodeAt(i);
			let h = 0.02519603282416938 * n;
			n = h >>> 0;
			h -= n;
			h *= n;
			n = h >>> 0;
			h -= n;
			n += h * 0x100000000; // 2^32
		}

		return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
	};

	return mash;
}
