
export const approx = ( num: number, epsilon = 0 ): {numerator: number, denominator: number} => {

	if ( Math.abs( num - Math.round( num ) ) <= epsilon )
		return { numerator: Math.round( num ), denominator: 1 };

	let z = num;
	let n = 0;
	let dPrev = 0;
	let d = 1;
	let approximate = n / d;

	while ( Math.abs( approximate - num ) > epsilon / d ** 2 ) {

		z = 1 / ( z - Math.floor( z ) );
		const dCopy = d;
		d = d * Math.floor( z ) + dPrev;
		dPrev = dCopy;
		n = Math.round( num * d );
		approximate = n / d;

	}

	return { numerator: n, denominator: d };

};

export const binaryDistance = ( num: number ): number => {

	// base cases
	if ( num === 0 ) return 0;
	const log2 = Math.log2( num );
	if ( Number.isInteger( log2 ) ) return log2 + 1;

	const ceiled = Math.ceil( log2 );
	let sum = 0;
	for ( let i = 0; i < ceiled; i ++ )
		if ( num & 2 ** i ) {

			sum += i + 1;
			1 + 1;

		}

	return sum;

};
