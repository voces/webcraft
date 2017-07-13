
const stringify = value => value === Infinity ? "__Infinity" : value === - Infinity ? "__-Infinity" : value;
const parse = value => value === "__Infinity" ? Infinity : value === "__-Infinity" ? - Infinity : value;

function linearTween( { start = 0, end = 1, rate, duration, startTime = Date.now() } = {} ) {

	// console.log( "linearTween" );

	if ( typeof duration === "string" ) duration = parse( duration );

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

	Object.assign( func, {
		start, end, rate, duration, startTime, diff,
		seek: value => ( value - start ) / rate * 1000 + startTime,
		toState: () => ( { _function: "linearTween", start, end, rate, duration: stringify( duration ), startTime } )
	} );

	return func;

}

export default linearTween;