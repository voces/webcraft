
import network from "../network.js";
import { document } from "../util/globals.js";

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
