
function linearTween( { start = 0, end = 1, rate, duration = 1, startTime = Date.now() } = {} ) {

	const diff = end - start;

	if ( rate === undefined ) {

		if ( duration === Infinity ) rate = 1;
		rate = diff / duration;

	}

	return ( time = Date.now() ) => {

		time = ( time - startTime ) / 1000;

		if ( time >= duration ) return end;

		// console.log( "run", time );

		return start + diff * time / rate;

	};

}

export default linearTween;
