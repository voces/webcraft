
import game from "../index.js";

// Formula taken from
// https://metinmediamath.wordpress.com/2013/11/27/how-to-calculate-the-elo-rating-including-example/

const K = 32;

// We assume crossers are winners, but swap if not based on scores
export default ( { mode, crossers: winners, defenders: losers, scores } ) => {

	if ( scores === 0 ) {

		const temp = winners;
		winners = losers;
		losers = temp;

		scores = 1;

	}

	for ( let i = 0; i < scores; i ++ )

		winners.forEach( winner => losers.forEach( loser => {

			const winnerTransformed = Math.pow( 10, winner.score[ mode ] / 400 );
			const loserTransformed = Math.pow( 10, loser.score[ mode ] / 400 );

			const winnerExpected = winnerTransformed / ( winnerTransformed + loserTransformed );
			const loserExpected = loserTransformed / ( winnerTransformed + loserTransformed );

			winner.score[ mode ] += Math.round( K * ( 1 - winnerExpected ) );
			loser.score[ mode ] += Math.round( K * ( 0 - loserExpected ) );

		} ) );

	updateDisplay();

};

const container = document.getElementById( "scores" );
export const updateDisplay = () => {

	container.innerHTML = "";

	game.players.forEach( player => {

		const playerName = document.createElement( "span" );
		playerName.textContent = player.id;
		playerName.style.color = player.color.hex;
		playerName.classList.add( "player" );
		container.appendChild( playerName );

		const score = document.createElement( "span" );
		score.textContent = player.score.standard;
		score.classList.add( "score" );
		container.appendChild( score );

	} );

};
