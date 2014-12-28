
var ui = {
	scheme: {
		container: 'body',
		rows: [
			{
				view: 'menu',
				id: "mainMenu",
				on: {onMenuItemclick: logic.menuSwitch},
				data: [
					{value: 'File', submenu: [
						'New',
						{$template: 'Separator'},
						'Open remote',
						'Save remote',
						{$template: 'Separator'},
						'Open local',
						'Save local'
					]},
					{value: 'Edit'},
					{value: 'View', submenu: [
						'Subtiles'
					]},
					{value: 'Window', submenu: [
						'Properties',
						{$template: 'Separator'},
						'Terrain Editor',
						'Object Editor',
						'Code Editor',
					]},
					{value: 'Mod', id: 'mod', submenu: []},
					{value: 'Help'},
				]
			},
			{cols: [
				{width: 256, minWidth: 64, rows: [
					{
						template: '<canvas id="preview"></canvas>',
						type: 'clean', height: 256
					},
					{template: 'Properties'}
				]},
				{view: 'resizer'},
				{
					id: 'worldContainer',
					type: 'clean'
				},
				{view: 'resizer'},
				{
					view: 'accordion', type: 'line',
					width: 256, minWidth: 64,
					rows: [
						{header: 'Terrain', body: 'Content a'},
						{header: 'Widgets', body: 'Content b',
							collapsed: true},
						{header: 'Geometry', body: 'Content c',
							collapsed: true}
					]
				}
			]},
			{template: 'row 3', height: 30}
		]
	}
}
