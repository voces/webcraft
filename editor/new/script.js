
var mods = window.opener.mods || new Emitter([]);

$(document).ready(function() {
	
	webix.ui({
		view: 'form', id: 'form',
		elements: [
			{rows: [
				{template: 'Properties', type: 'section'},
				{view: 'text', name: 'title', placeholder: 'Title', required: true},
				{view: 'text', name: 'author',  placeholder: 'Author'},
				{view: 'textarea', name: 'description',  placeholder: 'Description'}
			]},
			{rows: [
				{template: 'Geometry', type: 'section'},
				{view: 'radio', name: 'geoType', label: 'Geometry', id: 'geo', value: "flat", options: [
					{value: 'Flat', id: "flat"},
					{value: 'World', id: "world"}
				]},
				{id: 'flatSection', cols: [
					{view: 'text', name: 'width', placeholder: 'Width', validate: webix.rules.isNumber},
					{view: 'text', name: 'height', placeholder: 'Height', validate: webix.rules.isNumber},
				]},
				{id: 'worldSection', hidden: true, cols: [
					{view: 'text', name: 'radius', placeholder: 'Radius', validate: webix.rules.isNumber}
				]}
			]},
			{rows: [
				{template: 'Materials', type: 'section'}
			]},
			{view: 'button', type: 'form', value: 'Submit', id: 'submitter'}
		],
		elementsConfig: {
			on: {
				onChange: function() {
					this.validate();
				}
			}
		}
	});
	
	$$('geo').attachEvent('onChange', function(value) {
		if (value == 'flat') {
			$$('flatSection').show();
			$$('worldSection').hide();
		} else if (value == 'world') {
			$$('worldSection').show();
			$$('flatSection').hide();
		}
	});
	
	//Submit
	$$('submitter').attachEvent('onItemClick', function(a, e, i) {
		
		//Exit if not valid data
		if (!$$('form').validate()) return;
		
		//Grab our values
		var values = $$('form').getValues();
		values.width = parseInt(values.width);
		values.height = parseInt(values.height);
		values.radius = parseFloat(values.radius);
		
		//Create the mod
		var mod = new Mod(values);
		var id = mods.push(mod) - 1;
		
		//Build an event
		mods.emit('push', new CustomEvent('push', {
			detail: {mod: mod, id: id}
		}));
		
		//And we're done
		window.close();
		
	});
	
	$$('title').focus();
	
});
