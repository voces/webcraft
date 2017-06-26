
// Used for client-side clarity
function timeProperty( app, obj, name, noInterpolate ) {

	const times = [];
	const values = [];

	let lastTime;
	let lastValue;

	Object.defineProperty( obj, name, {
		get: () => {

			if ( lastTime === app.time ) return lastValue;
			if ( times.length === 0 ) return undefined;

			let index = times.length - 1;

			while ( index > 0 && times[ index ] > app.time )
				index --;

			if ( ! noInterpolate && typeof values[ index ] === "function" )
				lastValue = values[ index ]( app.time );
			else
				lastValue = values[ index ];

			return lastValue;

		},
		set: value => {

			let index = times.length;

			while ( index > 0 && times[ index - 1 ] > app.time )
				index --;

			if ( index !== times.length && times[ index ] === app.time ) {

				if ( values[ index ] === value ) return;

				values[ index ] = value;
				lastTime = undefined;

			}

			times.splice( index, 0, app.time );
			values.splice( index, 0, value );

		}
	} );

}

class TimeProperty {

	constructor() {

		this.times = [];
		this.values = [];

	}

	set( time, value ) {

		let index = this.times.length;

		while ( index > 0 && this.times[ index - 1 ] > time )
			index --;

		if ( index !== this.times.length && this.times[ index ] === time ) {

			if ( this.values[ index ] === value ) return;

			this.values[ index ] = value;
			this.lastTime = undefined;

		}

		this.times.splice( index, 0, time );
		this.values.splice( index, 0, value );

	}

	get( time ) {

		if ( this.lastTime === time ) return this.lastValue;
		if ( this.times.length === 0 ) return undefined;

		let index = this.times.length - 1;

		while ( index > 0 && this.times[ index ] > time )
			index --;

		if ( typeof this.values[ index ] === "function" )
			this.lastValue = this.values[ index ]( time );
		else
			this.lastValue = this.values[ index ];

		return this.lastValue;

	}

}

export { TimeProperty, timeProperty };
export default timeProperty;
