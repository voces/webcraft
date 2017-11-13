
// Formulas adapted from: https://stackoverflow.com/a/17096947/1567335

const stringify = value => value === Infinity ? "__Infinity" : value === - Infinity ? "__-Infinity" : value;
const parse = value => value === "__Infinity" ? Infinity : value === "__-Infinity" ? - Infinity : value;

function getCubicBezierAtPercent( start, end, percent, control1, control2 ) {

	const t2 = percent * percent;
	const t3 = t2 * percent;
	return start + ( - start * 3 + percent * ( 3 * start - start * percent ) ) * percent
		+ ( 3 * control1 + percent * ( - 6 * control1 + control1 * 3 * percent ) ) * percent
		+ ( control2 * 3 - control2 * 3 * percent ) * t2
		+ end * t3;

}

const getQuadraticBezierAtPercent = ( start, end, percent, control1 ) =>
	Math.pow( 1 - percent, 2 ) * start + 2 * ( 1 - percent ) * percent * control1 + Math.pow( percent, 2 ) * end;

const getLineAtPercent = ( start, end, percent ) => start + ( end - start ) * percent;

function approximateLength( start, end, control1, control2 ) {

	if ( control1 === undefined ) return end - start;

	const func = control2 !== undefined ? getCubicBezierAtPercent : getQuadraticBezierAtPercent;

	const distance = 0;

	let last = func( start, end, 0, control1, control2 );
	for ( let i = 0.01; i < 1; i += 0.01 ) {

		const test = func( start, end, i, control1, control2 );
		distance += ( test - last );
		last = test;

	}

	return distance;

}

function bezierTween( { start = 0, end = 1, control1, control2, rate, duration, startTime = Date.now() } = {} ) {

	if ( typeof duration === "string" ) duration = parse( duration );

	const diff = approximateLength( start, end, control1, control2 );

	if ( rate === undefined ) {

		if ( duration === Infinity ) rate = 1;
		else rate = diff / duration;

	}

	if ( duration === undefined ) duration = ( diff / rate ) || 0;

	const internalFunc = control2 !== undefined ? getCubicBezierAtPercent : control1 !== undefined ? getQuadraticBezierAtPercent : getLineAtPercent;

	const func = () => {

		const delta = ( func.time - func.startTime ) / 1000;

		if ( delta >= duration ) return end;

		return internalFunc( start, end, rate / diff, control1, control2 );

	};

	Object.assign( func, {
		start, end, rate, duration, startTime, diff, control1, control2, internalFunc,
		seek: value => ( value - start ) / rate * 1000 + func.startTime,
		toState: () => ( { _function: "bezierTween", start, end, rate, duration: stringify( duration ), control1, control2, startTime: func.startTime } )
	} );

	return func;

}

export default bezierTween;
