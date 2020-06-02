
// eslint-disable-next-line @typescript-eslint/no-explicit-any

export type EventMap = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[name: string]: ( ...args: any[] ) => void
}

type EventMapArray<Events> = {
	[Event in keyof Events]?: Events[Event][]
};

export interface Emitter<Events extends EventMap> {
	addEventListener: <Event extends keyof Events>( name: Event, callback: Events[Event] ) => void;
	removeEventListener: <Event extends keyof Events>( name: Event, callback: Events[Event] ) => void;
	removeEventListeners: <Event extends keyof Events>( name?: Event ) => void;
	dispatchEvent: <Event extends keyof Events>( name: Event, ...args: Parameters<Events[Event]> ) => void;
}

export default <T, Events extends EventMap>( host: T ): T & Emitter<Events> => {

	let events: EventMapArray<Events> = {};

	const modifiedHost = host as T & Emitter<Events>;

	modifiedHost.addEventListener = <Event extends keyof Events>( name: Event, callback: Events[Event] ) => {

		const callbacks: Events[Event][] = events[ name ] ?? [];

		if ( ! events[ name ] ) events[ name ] = callbacks;

		callbacks.push( callback );

	};

	modifiedHost.removeEventListener = <Event extends keyof Events>( name: Event, callback: Events[Event] ) => {

		const callbacks: Events[Event][] | undefined = events[ name ] ?? undefined;
		if ( ! callbacks ) return;

		const index = callbacks.indexOf( callback );
		if ( index >= 0 ) callbacks.splice( index, 1 );

	};

	modifiedHost.removeEventListeners = name => {

		if ( ! name ) {

			events = {};
			return;

		}

		events[ name ] = [];

	};

	modifiedHost.dispatchEvent = <Event extends keyof Events>( name: Event, ...args: Parameters<Events[Event]> ) => {

		const callbacks: Events[Event][] | undefined = events[ name ] ?? undefined;
		if ( ! callbacks ) return;

		callbacks.forEach( callback => callback.apply( host, args ) );

	};

	return modifiedHost;

};
