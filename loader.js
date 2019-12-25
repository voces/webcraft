
import Module from "module";

const builtins = Module.builtinModules;

const modernLibraries = [ "three" ];

export function resolve( specifier, parentModuleURL, defaultResolve ) {

	// Node built-ins, should only be used in tests/server-side things
	if ( builtins.includes( specifier ) )
		return {
			url: specifier,
			format: "builtin"
		};

	// Some libraries might be ESM, but not with .mjs :(
	if ( ( ! /^\.{0,2}[/]/.test( specifier ) || specifier.includes( "node_modules" ) ) &&
		(
			modernLibraries.includes( specifier.split( "/" )[ 0 ] ) ||
			modernLibraries.includes( specifier.split( "node_modules/" ).pop().split( "/" )[ 0 ] )
		) )
		return { ...defaultResolve( specifier, parentModuleURL ), format: "esm" };

	// All other JS files, ESM files must have .mjs
	return defaultResolve( specifier, parentModuleURL );

}
