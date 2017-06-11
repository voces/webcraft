
function glsl() {

	return {

		transform( code, id ) {

			if ( /\.glsl$/.test( id ) === false ) return;

			const transformedCode = "export default " + JSON.stringify(
					code.replace( /[ \t]*\/\/.*\n/g, "" ) // remove //
						.replace( /[ \t]*\/\*[\s\S]*?\*\//g, "" ) // remove /* */
						.replace( /\n{2,}/g, "\n" ) // # \n+ to \n
					) + ";";

			return {
				code: transformedCode,
				map: { mappings: "" }
			};

		}

	};

}

export default {
	entry: "src/webcraft.js",
	indent: "\t",
	plugins: [ glsl() ],
	external: [ "three", "ws" ],
	globals: { "three": "THREE", "ws": "ws" },
	sourceMap: true,
	targets: [
		{ format: "umd", moduleName: "WebCraft", dest: "build/webcraft.js" },
		{ format: "es", dest: "build/webcraft.module.js" }
	]
};
