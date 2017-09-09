
function stepTween( { steps, loop = false } ) {

	let active = 0;

	const func = () => {

		while ( func.time >= steps[ active ].startTime + steps[ active ].duration * 1000 && ( active < steps.length - 1 || loop ) )

			if ( active === steps.length - 1 ) {

				if ( loop ) {

					for ( let i = 0; i < steps.length; i ++ )
						steps[ i ].startTime += duration * 1000;

					active = 0;

				}

			} else active ++;

		return steps[ active ]();

	};

	const start = steps[ 0 ].start;
	const end = steps[ steps.length - 1 ].end;
	const startTime = steps[ 0 ].startTime;
	const rate = steps.reduce( ( total, step ) => total + step.rate, 0 ) / steps.length;
	const duration = steps.reduce( ( total, step ) => total + step.duration, 0 );
	const diff = steps.reduce( ( total, step ) => total + step.diff, 0 );

	Object.assign( func, {
		start, end, rate, duration, startTime, diff,
		// TODO: write seek; start with active, move down (loop if set) until we find the range and then calculate using step's seek
		seek: () => func.time,
		toState: () => ( { _function: "stepTween", steps, loop } )
	} );

	return func;

}

export default stepTween;
