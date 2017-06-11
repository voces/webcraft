
function linearTween( { start = 0, end = 1, rate, duration, startTime = Date.now() } = {} ) {

	const diff = end - start;

	if ( rate === undefined ) {

		if ( duration === Infinity ) rate = 1;
		else rate = diff / duration;

	}

	if ( duration === undefined ) duration = diff / rate;

	const func = ( time = Date.now() ) => {

		const delta = ( time - startTime ) / 1000;

		if ( delta >= duration ) return end;

		return start + delta * rate;

	};

	Object.assign( func, { start, end, rate, duration, startTime, diff, seek: value => ( value - start ) / rate * 1000 + startTime } );

	return func;

}

export default linearTween;
