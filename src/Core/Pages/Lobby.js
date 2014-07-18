
/**********************************
**	Constructor
***********************************/

Core.Pages.Lobby = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	
	this.prompt = null;
	this.showSettings = false;
	
	this.register = false;
	this.prevAccount = "";
	this.prevPassword = "";
	
	$(document).ready(this.load.bind(this));
};

/**********************************
**	Menu Options
***********************************/

Core.Pages.Lobby.prototype.selectNova = function() {
	if (!this.nova.connected()) this.nova.loadSocket();
	
	
	if (!this.login.parents().is(this.page)) {
		this.login.css('opacity', 0);
		this.login.animate({opacity: 1});
		
		this.page.append(this.login);
		this.account.focus();
	}
};

Core.Pages.Lobby.prototype.detachNova = function() {
	this.login.detach();
};

Core.Pages.Lobby.prototype.selectGithub = function() {
	window.open('https://github.com/voces/webcraft', '_blank');
};

Core.Pages.Lobby.prototype.selectSettings = function() {
	console.log('selectSettings');
	if (this.showSettings) {
		$(this.settingsPanel).stop().animate({right: "-19.1em"});
		$(this.settings).stop().animate({right: "1em"});
		this.showSettings = false;
	} else {
		$(this.settingsPanel).stop().animate({right: "0"});
		$(this.settings).stop().animate({right: "19.1em"});
		this.showSettings = true;
	}
};

/**********************************
**	Menu Options
***********************************/

Core.Pages.Lobby.prototype.focusPassword = function(e) {
	if (e.which == 13) {
		
		if (this.account.val() == "") this.account.val('anon');
		
		this.password.select();
	}
};

Core.Pages.Lobby.prototype.tryLogin = function(e) {
	if (e.which == 13) {
		
		this.container.after(this.shield);
		this.prompt.show();
		
		var account = (this.account.val() ? this.account.val() : 'anon');
		var password = this.password.val();
		
		if (account == this.prevAccount && password == this.prevPassword && this.register === true) {
			this.prompt.text('Registering');
			this.core.secureRegister(account, password);
			
			this.register = false;
		} else {
			
			this.prevAccount = account;
			this.prevPassword = password;
			
			this.prompt.text('Logging in');
			this.core.secureLogin(account, password);
		}
	}
};

Core.Pages.Lobby.prototype.cancelLogin = function(e) {
	this.login.detach();
};

/**********************************
**	Global Hooks
***********************************/

Core.Pages.Lobby.prototype.keydown = function(e) {
	
	//N or n
	if (document.activeElement.tagName == 'BODY' && (e.which == 78 || e.which == 110)) {
		this.selectNova();
		e.preventDefault();
	
	//G or g
	} else if (document.activeElement.tagName == 'BODY' && (e.which == 71 || e.which == 103)) {
		this.selectGithub();
		e.preventDefault();
	
	//S or s
	} else if (document.activeElement.tagName == 'BODY' && (e.which == 83 || e.which == 115)) {
		this.selectSettings();
		e.preventDefault();
	
	//Esc
	} else if (e.which == 27) {
		if (this.login.parents().is(this.page))
			this.login.animate({opacity: 0}, this.detachNova.bind(this));
	}
};

/**********************************
**	Communications
***********************************/

Core.Pages.Lobby.prototype.onLogin = function(e2, e) {
	
};

Core.Pages.Lobby.prototype.onLoginFail = function(e2, e) {
	
	this.container.before(this.shield);
	this.prompt.hide();
	this.error.show();
	
	if (e.reason == 'password') {
		this.error.text('Invalid password');
		/*this.error.promptText('Invalid password');
		this.prompt.retry();*/
	} else if (e.reason == 'account') {
		this.error.html('Account does not exist. Try again to register.');
		/*this.prompt.promptText('Account does not exist.<br>Press enter to register.');
		this.prompt.register = true;*/
		this.register = true;
	}
};

Core.Pages.Lobby.prototype.onRegister = function(e2, e) {
	
	this.tryLogin({which: 13});
	
};

Core.Pages.Lobby.prototype.onRegisterFail = function(e2, e) {
	
	this.container.before(this.shield);
	this.prompt.hide();
	this.error.show();
	
	if (e.reason == 'invalid') {
		this.error.text('Account is invalid. Accounts may only use alphabetic characters.');
		this.account.select();
	} else {
		this.error.text('Uncoded error #951356');
	}
};

/**********************************
**	Initializer
***********************************/

//I really don't like this, I'd prefer using some type of HTML template...
Core.Pages.Lobby.prototype.template = function() {
	
	this.page = $('<div></div>').addClass('Lobby');	//.appendTo('body');
	
	this.menu = $('<div></div>').addClass('menu').appendTo(this.page);
		
		this.play = $('<p></p>').addClass('nova hoverglow').text('Nova').appendTo(this.menu);
		this.about = $('<p></p>').addClass('about').text('About WebCraft').appendTo(this.menu);
		this.gallery = $('<p></p>').addClass('gallery').text('Gallery').appendTo(this.menu);
		this.editor = $('<p></p>').addClass('editor').text('Editor').appendTo(this.menu);
		this.github = $('<p></p>').addClass('github hoverglow').text('GitHub').appendTo(this.menu);
	
	this.settings = $('<div></div>').addClass('settings').appendTo(this.page);
	
	this.settingsPanel = $('<div></div>').addClass('settingsPanel').appendTo(this.page);
		
		$('<h1></h1>').text('Network Settings').appendTo(this.settingsPanel);
		$('<label></label>').text('Address').appendTo(this.settingsPanel);
		this.address = $('<input />').addClass('address').attr('type', 'text').val('ws://68.229.21.36:8082').attr('placeholder', 'Address').appendTo(this.settingsPanel);
	
	this.login = $('<div></div>').addClass('login');
		
		this.shield = $('<div></div>').addClass('shield').appendTo(this.login);
		
		this.container = $('<div></div>').addClass('container').appendTo(this.login);
		
			$('<h1></h1>').text('Log into Nova').appendTo(this.container);
			
			$('<label></label>').text('Account').appendTo(this.container);
			this.account = $('<input />').addClass('account').attr('type', 'text').attr('placeholder', 'Account').appendTo(this.container);
			
			$('<label></label>').text('Password').appendTo(this.container);
			this.password = $('<input />').addClass('password').attr('type', 'password').attr('placeholder', 'Password').appendTo(this.container);
			
			this.error = $('<div></div>').addClass('error').appendTo(this.container);
			
			this.buttons = $('<div></div>').addClass('buttons').appendTo(this.container);
				
				this.next = $('<input />').addClass('next').attr('type', 'button').val('Login').appendTo(this.buttons);
				this.cancel = $('<input />').addClass('cancel').attr('type', 'button').val('Cancel').appendTo(this.buttons);
		
		this.prompt = $('<h3></h3>').addClass('prompt').appendTo(this.login);
};

Core.Pages.Lobby.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Lobby', this.keydown.bind(this));
	
	//Communications
	$(this.nova).on('onLogin.Lobby', this.onLogin.bind(this));
	$(this.nova).on('onLoginFail.Lobby', this.onLoginFail.bind(this));
	$(this.nova).on('onRegister.Lobby', this.onRegister.bind(this));
	$(this.nova).on('onRegisterFail.Lobby', this.onRegisterFail.bind(this));
	
};

Core.Pages.Lobby.prototype.unbindGlobals = function() {
	
	$(window).off('Lobby');
	$(this.nova).off('Lobby');
	
};

Core.Pages.Lobby.prototype.load = function() {
	
	this.template();
	
	//Menu options
	$(this.play).on('click', this.selectNova.bind(this));
	$(this.github).on('click', this.selectGithub.bind(this));
	$(this.settings).on('click', this.selectSettings.bind(this));
	
	//Login events
	$(this.account).on('keydown', this.focusPassword.bind(this));
	$(this.password).on('keydown', this.tryLogin.bind(this));
	$(this.cancel).on('click', this.cancelLogin.bind(this));
	
	this.bindGlobals();
	
};
