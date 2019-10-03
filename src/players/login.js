
import network from "../network.js";

const login = document.getElementById( "login" );
const loginName = document.getElementById( "login-name" );

loginName.focus();

loginName.addEventListener( "keydown", e => {

	e.stopPropagation();

	if ( e.key === "Enter" ) {

		network.connect( loginName.value );
		login.style.visibility = "hidden";

	}

} );
