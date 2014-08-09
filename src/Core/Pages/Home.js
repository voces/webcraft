
/**********************************
**	Constructor
***********************************/

Core.Pages.Home = function(pages) {
	
	this.pages = pages;
	this.core = pages.core;
	this.nova = pages.nova;
	
	this.ready = false;
	this.toFade = null;
	
	this.prompt = null;
	this.showSettings = false;
	
	this.register = false;
	this.prevAccount = "";
	this.prevPassword = "";
	
	this.connecting = false;
	
	this.page = $('<div></div>').addClass('Home').load(
		'src/Core/Pages/Home/HomeTemplate.html',
		this.load.bind(this)
	);
	
};

/**********************************
**	Menu Options
***********************************/

Core.Pages.Home.prototype.selectNova = function() {
	
	//Connect to Nova if we aren't
	if (!this.nova.connected()) {
		
		this.shield.show();
		this.prompt
			.text('Connecting to Nova')
			.append(new Ellipse());
		
		this.connecting = true;
		this.nova.loadSocket(this.address.val());
		
	//We're connected, if we're logged in, just go to portal
	} else if (this.core.logged) {
		
		this.fadeOut();
		this.pages.portal.fadeIn();
	
	//Connected but not logged in, show login prompt
	} else this.showLogin();
};

Core.Pages.Home.prototype.selectForum = function() {
	document.location.href = "//chatcraft.net/forum/";
};

Core.Pages.Home.prototype.selectEditor = function() {
	this.fadeOut();
	this.pages.editor.fadeIn();
};

Core.Pages.Home.prototype.selectBitbucket = function() {
	window.open('https://bitbucket.org/voces/webcraft', '_blank');
};

Core.Pages.Home.prototype.selectSettings = function() {
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
**	Menu options stuff
***********************************/

Core.Pages.Home.prototype.showLogin = function() {
	if (!this.loginPanel.is('visible')) {
		this.loginPanel.css('opacity', 0);
		this.loginPanel.animate({opacity: 1});
		
		this.loginPanel.show();
		
		if (this.account.val() != "")
			this.password.select();
		else
			this.account.select();
	}
};

Core.Pages.Home.prototype.focusPassword = function(e) {
	if (e.which == 13) {
		
		if (this.account.val() == "") this.account.val('anon');
		
		this.password.select();
	}
};

Core.Pages.Home.prototype.tryLogin = function() {
	
	this.shield.show();
	
	var account = (this.account.val() ? this.account.val() : 'anon');
	var password = this.password.val();
	
	if (account == this.prevAccount && password == this.prevPassword && this.register === true) {
		this.prompt
			.text('Registering')
			.append(new Ellipse());
		this.core.secureRegister(account, password);
		
		this.register = false;
	} else {
		
		this.prevAccount = account;
		this.prevPassword = password;
		
		this.prompt
			.text('Logging in')
			.append(new Ellipse());
		this.core.secureLogin(account, password);
	}
};

Core.Pages.Home.prototype.pwdKeydown = function(e) {
	
	//Enter
	if (e.which == 13)
		this.tryLogin();
	
	//Tab
	else if (e.which == 9 || e.which == 38) {
		this.account.select();
		e.preventDefault();
	}
};

Core.Pages.Home.prototype.cancelLogin = function(e) {
	this.loginPanel.hide();
};

/**********************************
**	Global Hooks
***********************************/

Core.Pages.Home.prototype.hideLoginPanel = function() {
	this.loginPanel.hide();
}

Core.Pages.Home.prototype.keydown = function(e) {
	
	if (document.activeElement.tagName == 'BODY') {
		switch (e.which) {
			
			//n
			case 78:
				this.selectNova();
				e.preventDefault();
			
			//f
			break; case 70:
				this.selectForum();
				e.preventDefault();
			
			//b
			break; case 66:
				this.selectBitbucket();
				e.preventDefault();
			
			//e
			/*break; case 69:
				this.selectEditor();
				e.preventDefault();*/
			
			//s
			break; case 83:
				this.selectSettings();
				e.preventDefault();
			break;
		}
	
	//Esc
	} else if (e.which == 27) {
		if (!this.loginPanel.is('visible'))
			this.loginPanel.animate({opacity: 0}, this.hideLoginPanel.bind(this));
	}
};

/**********************************
**	Communications
***********************************/

//Connected
Core.Pages.Home.prototype.onOpen = function(e2, e) {
	this.shield.fadeOut();
	this.showLogin();
};

//Failed to connect
Core.Pages.Home.prototype.onClose = function(e2, e) {
	
	if (!this.connecting) return;
	this.connecting = true;
	
	this.shield.show();
	this.prompt
		.text("")
		.append($("<span></span>")
			.css("color", "red")
			.text("Unable to connect to Nova."));
	
	setTimeout(function() {
		this.shield.fadeOut();
	}.bind(this), 3000);
	
};

Core.Pages.Home.prototype.onLogin = function(e2, e) {
	
	this.prompt.text('Success');
	this.password.val('');
	
	this.fadeOut();
	this.pages.portal.fadeIn();
	
};

Core.Pages.Home.prototype.onLoginFail = function(e2, e) {
	
	this.shield.hide();
	this.error.show();
	
	if (e.reason == 'password')
		this.error.text('Invalid password');
	else if (e.reason == 'account') {
		this.error.html('Account does not exist. Try again to register it.');
		this.register = true;
	}
};

Core.Pages.Home.prototype.onRegister = function(e2, e) {
	this.tryLogin();
};

Core.Pages.Home.prototype.onRegisterFail = function(e2, e) {
	
	this.shield.hide();
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

Core.Pages.Home.prototype.fadeIn = function(instant) {
	
	if (!this.ready) {
		this.toFade = instant;
		return;
	}
	
	this.shield.hide();
	this.loginPanel.hide();
	this.error.show();
	
	if (instant) {
		this.page.css('opacity', 1);
		this.bindGlobals();
	} else {
		this.page.css('opacity', 0);
		this.page.animate({opacity: 1}, this.bindGlobals.bind(this));
	}
	
	this.page.show();
	//this.page.appendTo('body');
	
};

Core.Pages.Home.prototype.fadeOutComplete = function() {
	
	this.page.hide();
	this.unbindGlobals();
	
};

Core.Pages.Home.prototype.fadeOut = function() {
	this.page.animate({opacity: 0}, this.fadeOutComplete.bind(this));
};

Core.Pages.Home.prototype.bindGlobals = function() {
	
	//Global hooks
	$(window).on('keydown.Home', this.keydown.bind(this));
	
	//Communications
	$(this.nova).on('onOpen.Home', this.onOpen.bind(this));
	$(this.nova).on('onClose.Home', this.onClose.bind(this));
	
	$(this.nova).on('onLogin.Home', this.onLogin.bind(this));
	$(this.nova).on('onLoginFail.Home', this.onLoginFail.bind(this));
	$(this.nova).on('onRegister.Home', this.onRegister.bind(this));
	$(this.nova).on('onRegisterFail.Home', this.onRegisterFail.bind(this));
	
};

Core.Pages.Home.prototype.unbindGlobals = function() {
	
	$(window).off('.Home');
	$(this.nova).off('.Home');
	$(this.host).off('.Home');
	
};

Core.Pages.Home.prototype.load = function() {
	
	$(this.page).find('*').each(variablize.bind(this));
	
	this.loginPanel.hide();
	
	/**********************************
	**	Local hooks
	***********************************/
	
	//Menu options
	$(this.novaP).on('click', this.selectNova.bind(this));
	$(this.forum).on('click', this.selectForum.bind(this));
	//$(this.editor).on('click', this.selectEditor.bind(this));
	$(this.bitbucket).on('click', this.selectBitbucket.bind(this));
	$(this.settings).on('click', this.selectSettings.bind(this));
	
	//Login events
	$(this.account).on('keydown', this.focusPassword.bind(this));
	$(this.password).on('keydown', this.pwdKeydown.bind(this));
	$(this.login).on('click', this.tryLogin.bind(this));
	$(this.cancel).on('click', this.cancelLogin.bind(this));
	
	this.page.appendTo('body');
	
	this.ready = true;
	
	if (this.toFade != null) {
		this.fadeIn(this.toFade);
		this.toFade = null;
	}
};
