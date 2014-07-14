
/**********************************
**	Constructor
***********************************/

Core.Pages.Editor.Map = function(options) {
	
	this.title = options.title || 'Untitled';
	this.description = options.description || '';
	this.author = options.author || 'Unknown';
	this.width = parseFloat(options.width) || 1;
	this.height = parseFloat(options.height) || 1;
	
	this.lastSaved = Date.now();
	this.build = 0;
	this.ancestry = [];
	
};

/**********************************
**	Initializer
***********************************/
