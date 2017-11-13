
const stringify = value => value === Infinity ? "__Infinity" : value === - Infinity ? "__-Infinity" : value;
const parse = value => value === "__Infinity" ? Infinity : value === "__-Infinity" ? - Infinity : value;

function linearTween( { duration, value, start, end, startTime = Date.now() } = {} ) {

	if ( typeof duration === "string" ) duration = parse( duration );

	const returnedValue = value !== undefined ? value : start !== undefined ? start : end;
	const func = () => returnedValue;

	Object.assign( func, {
		duration, value, start, end, startTime,
		seek: () => {},
		toState: () => ( { _function: "linearTween", value, start, end, duration: stringify( duration ), startTime: func.startTime } )
	} );

	return func;

}

export default linearTween;
