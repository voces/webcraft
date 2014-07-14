
var core;
$(document).ready(function() {
	core = new Core();
	
	$(core.nova).on('reload', function(e2, e) {
		
		console.log('reload', e.degree);
		
		if (e.degree == "css") reloadStylesheets();
		else if (e.degree == "page") location.reload(true);
		
	});
}.bind(this));
