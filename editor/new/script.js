
var editor;
$(document).ready(function() {
	
	editor = new SharedWorker('../worker/worker.js')
	editor.port.start();
	
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
	
	$$('submitter').attachEvent('onItemClick', function(a, e, i) {
		if (!$$('form').validate()) return;
		
		var values = $$('form').getValues();
		
		values.width = parseInt(values.width);
		values.height = parseInt(values.height);
		values.radius = parseFloat(values.radius);
		
		editor.port.postMessage({id: 'newMod', data: values});
		
		window.close();
	});
	
	$$('title').focus();
	
});
