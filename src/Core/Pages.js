Core.Pages = function(core) {
	
	this.core = core;
	this.nova = core.nova;
	
	this.home = new Core.Pages.Home(this);
	this.portal = new Core.Pages.Portal(this);
	this.editor = new Core.Pages.Editor(this);
	
	$(document).ready(this.load.bind(this));
};

//Core.prototype.Pages.prototype.core = Core;

Core.Pages.prototype.load = function() {
	this.home.fadeIn(true);
};
