
import { approx } from "./irrationality.js";

describe( "approx", () => {

	describe( "epsilon=0", () => {

		describe( "exact matches", () => {

			[
				{ n: 1, d: 1 },
				{ n: 2, d: 3 },
				{ n: 7, d: 13 },
				{ n: 161803, d: 10000 },
				{ n: 50039995859672, d: 150119987579017 },
			].forEach( ( { n, d } ) => {

				it( `${n}/${d}`, () => {

					expect( approx( n / d ) )
						.toEqual( { numerator: n, denominator: d } );

				} );

			} );

		} );

		describe( "reducible", () => {

			[
				{ input: { n: 2, d: 2 }, output: { n: 1, d: 1 } },
				{ input: { n: 2, d: 4 }, output: { n: 1, d: 2 } },
				{ input: { n: 4, d: 6 }, output: { n: 2, d: 3 } },
				{ input: { n: 16180, d: 1000 }, output: { n: 809, d: 50 } },
			].forEach( ( { input, output } ) => {

				it( `${input.n}/${input.d} => ${output.n}/${output.d}`, () => {

					expect( approx( input.n / input.d ) ).toEqual(
						{ numerator: output.n, denominator: output.d },
					);

				} );

			} );

		} );

	} );

	describe( "epsilon=1e-10", () => {

		[
			// 1 / 3 - Number.EPSILON * 10
			{ input: { n: 50039995859672, d: 150119987579017 }, output: { n: 1, d: 3 } },
			// 13 / 11 + Number.EPSILON * 10
			{ input: { n: 46912496118442, d: 39695189023297 }, output: { n: 13, d: 11 } },
		].forEach( ( { input, output } ) => {

			it( `${input.n}/${input.d} => ${output.n}/${output.d}`, () => {

				expect( approx( input.n / input.d, 1e-10 ) ).toEqual(
					{ numerator: output.n, denominator: output.d },
				);

			} );

		} );

	} );

} );
