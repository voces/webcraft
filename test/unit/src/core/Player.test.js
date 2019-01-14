
import assert from "assert";

import Handle from "../../../../src/core/Handle.js";
import Player from "../../../../src/core/Player.js";

describe( "Player", () => {

	it( "#get nextColorIndex", () => {

		const colors = Player.colors;
		Player.colors = [ {}, {} ];

		assert.equal( Player.nextColorIndex, 0 );

		Player.colors[ 0 ].taken = true;
		assert.equal( Player.nextColorIndex, 1 );

		Player.colors[ 1 ].taken = true;
		assert.throws( () => Player.nextColorIndex, Error );

		Player.colors = colors;

	} );

	it( "Extends Handle", () => assert.ok( new Player() instanceof Handle ) );
	it( "Automatic key", () => {

		const player = new Player();

		assert.ok( player.key.startsWith( "p" ) );
		assert.equal( parseInt( player.key.slice( 1 ) ), player.id );

	} );

	it( "toState()", () => {

		const color = Player.colors.findIndex( c => ! c.taken );
		const player = new Player();

		assert.deepEqual( player.toState(), { key: player.key, _collection: "players", _constructor: "Player", color, status: "here" } );

	} );

	it( "remove()", () => {

		const guessedColor = Player.colors.findIndex( c => ! c.taken );
		const player = new Player();

		assert.ok( Player.colors[ guessedColor ].taken );

		player.remove();

		assert.ok( ! Player.colors[ guessedColor ].taken );
		assert.equal( player.status, "removed" );

	} );

	it( "set color", () => {

		const player = new Player();
		const currentColor = player.color;
		const nextColor = Player.colors[ Player.nextColorIndex ];

		// Color object
		player.color = nextColor;
		assert.ok( ! currentColor.taken );
		assert.ok( nextColor.taken );

		player.color = currentColor;

		assert.throws( () => player.color = {}, Error );

		// Color index
		player.color = Player.colors.indexOf( nextColor );
		assert.ok( ! currentColor.taken );
		assert.ok( nextColor.taken );

		player.color = currentColor;

		assert.throws( () => player.color = Player.colors.length, Error );

		// Color name and hex
		player.color = nextColor.name;
		assert.ok( ! currentColor.taken );
		assert.ok( nextColor.taken );

		player.color = currentColor;

		player.color = nextColor.hex;
		assert.ok( ! currentColor.taken );
		assert.ok( nextColor.taken );

		player.color = currentColor;

		assert.throws( () => player.color = "test", Error );

	} );

} );
