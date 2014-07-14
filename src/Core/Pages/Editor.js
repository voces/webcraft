
/**********************************
**	Constructor
***********************************/

Core.Pages.Editor = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	
	this.activated = false;
	
	this.maps = [];
	
	this.page = $('<section></section>').addClass('Editor ui-layout-container').load(
		'src/Core/Pages/Editor/Editor.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	Windows
***********************************/

Core.Pages.Editor.prototype.setMap = function(map) {
	
	//Grab the index of the map
	var index = this.maps.indexOf(map);
	
	//If it doesn't exist, that's because the map isn't in a list (maybe new, IDK)
	//	So add it to list and grab index again
	if (index < 0) {
		this.maps.push(map);
		index = this.maps.indexOf(map);
	}
	
	
};

/**********************************
**	Menu
***********************************/

Core.Pages.Editor.prototype.newMap = function(e) {
	//console.log(this.prompt);
	//this.prompt.show('newMap');
	
	//Show the mapDialog in the prompt
	this.page.pContainer.children().hide();
	this.page.mapDialog.show();
	
	//Show step one of the map dialog
	this.page.mapDialog.children().hide();
	this.page.mapDialog1.show();
	
	//Fade in the prompt
	this.page.prompt.fadeIn();
	
	//Select first box
	this.page.mapDialogTitle.select();
};

Core.Pages.Editor.prototype.mapDialogTitleKeydown = function(e) {
	if (e.which == 13) this.page.mapDialogDescription.select();
};

Core.Pages.Editor.prototype.mapDialogDescriptionKeydown = function(e) {
	if (e.which == 13) this.page.mapDialogAuthor.select();
};

Core.Pages.Editor.prototype.mapDialogAuthorKeydown = function(e) {
	if (e.which == 13) this.mapDialogNextClick(e);
};

Core.Pages.Editor.prototype.mapDialogWidthKeydown = function(e) {
	if (e.which == 13) this.page.mapDialogHeight.select();
};

Core.Pages.Editor.prototype.mapDialogHeightKeydown = function(e) {
	if (e.which == 13) this.mapDialogNextClick(e);
};

Core.Pages.Editor.prototype.mapDialogNextClick = function(e) {
	var current = $(e.target).parent().parent();
	var next = current.next();
	
	if (next.length) {
		current.fadeOut();
		next.fadeIn();
		next.find('input').first().select();
	} else {
		console.log('end');
		
		var map = new Core.Pages.Editor.Map({
			title: this.page.mapDialogTitle.val(),
			description: this.page.mapDialogDescription.val(),
			author: this.page.mapDialogAuthor.val(),
			width: this.page.mapDialogWidth.val(),
			height: this.page.mapDialogHeight.val()
		});
		
		this.maps.push(map);
		
		this.page.prompt.fadeOut();
		
		this.page.windowsMenu.append($('<div></div>').text(map.title));
		
		this.setMap(map);
	}
};

Core.Pages.Editor.prototype.mapDialogCancelClick = function(e) {
	this.page.prompt.fadeOut();
};

Core.Pages.Editor.prototype.mainMenu = function(e) {
	this.fadeOut();
	this.pages.home.fadeIn();
};

Core.Pages.Editor.prototype.hideLayer = function(e) {
	$(e.target).parent().parent().fadeOut();
};

Core.Pages.Editor.prototype.showTerrainLayer = function(e) {
	
	//Show the layer
	$(this.page.terrainLayer).fadeIn();
	
	//Fade the menu
	$(this.page.layersMenu).fadeOut(100, function() {
		
		//Hide it
		$(this.page.layersMenu).css("margin-left", "-1000em");
		setTimeout(function() {
			
			//Allow it to come up again (half a second later)
			$(this.page.layersMenu).removeAttr('style');
		}.bind(this), 500);
	}.bind(this));
};

/**********************************
**	Global Hooks
***********************************/

Core.Pages.Editor.prototype.keydown = function(e) {
	
	//Alt
	if (e.which == 18) {
		$('.hotkey').css('text-decoration', 'underline');
		
		e.preventDefault();
	
	//Alt + F
	} else if (e.which == 70 && e.altKey) {
		$(this.page.primary).find('> :nth-child(1)').addClass('hovered');
		
		e.preventDefault();
		
	//Esc
	} else if (e.which == 27) {
		if (!this.page.prompt.is('visible'))
			this.page.prompt.fadeOut();
	}
};

Core.Pages.Editor.prototype.keyup = function(e) {
	
	//Alt
	if (e.which == 18) {
		$('.hotkey').css('text-decoration', 'none');
	
	}
};

/**********************************
**	Communications
***********************************/

/**********************************
**	Initializer
***********************************/

Core.Pages.Editor.prototype.fadeIn = function(instant) {
	
	if (instant) {
		this.page.css('opacity', 1);
	} else {
		this.page.css('opacity', 0);
		this.page.animate({opacity: 1});
	}
	
	this.page.show();
	//this.page.appendTo('body');
	
	if (!this.activated) this.firstActivate();
	
	this.bindGlobals();
	
};

Core.Pages.Editor.prototype.fadeOutComplete = function() {
	
	this.page.hide();
	//this.page.detach();
	this.unbindGlobals();
	
};

Core.Pages.Editor.prototype.fadeOut = function() {
	
	this.page.animate({opacity: 0}, this.fadeOutComplete.bind(this));
	
};

Core.Pages.Editor.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Editor', this.keydown.bind(this));
	$(window).on('keyup.Editor', this.keyup.bind(this));
	
	//Communications
	
	
};

Core.Pages.Editor.prototype.unbindGlobals = function() {
	
	$(window).off('.Editor');
	$(this.nova).off('.Editor');
	
};

Core.Pages.Editor.prototype.firstActivate = function() {
	$(this.page).layout({
		defaults: {
			spacing_open: 4,
			togglerLength_open: 21,
			togglerLength_closed: 21,
			closeable: true,
			resizeable: true
		},
		north: {
			spacing_open: 0,
			togglerLength_open: 0,
			togglerLength_closed: 0,
			size: 25,
			showOverflowOnHover: true
		}
	});
	
	$(".Editor .mapDialog .next").on('click', this.mapDialogNextClick.bind(this));
	$(".Editor .mapDialog .cancel").on('click', this.mapDialogCancelClick.bind(this));
	
	$(".Editor .ui .layer h3 span.close").on('click', this.hideLayer.bind(this));
	
	this.activated = true;
};

Core.Pages.Editor.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this.page));	//Note this.page instead of this
	
	/**********************************
	**	Create UI elements
	***********************************/
	
	$(this.page.menu).jqsimplemenu();
	
	$(this.page.container1).tabs({ collapsible: true });
	
	this.newmapDialog = $(this.page.newmap).dialog({
		appendTo: this.page,
		minHeight: 300,
		minWidth: 500
	});
	
	$(this.page.newmap).find('.slider > div').slider({
		min: 1,
		max: 1000,
		step: 1,
		slide: function(e, ui) {
			$(e.target).prev().val(parseInt(Math.pow(1+ui.value/100, 4)));
		}
	});
	
	$(this.page.newmap).find('.slider > input').keyup(function(e) {
		console.log(e);
		$(e.target).next().slider("value", parseInt((Math.log(e.target.value)/Math.log(4)-1)*100));
	});
	
	this.page.hide();
	this.page.appendTo('body');
	
};
