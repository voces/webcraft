/**
 * ThreeUtil.js
 *
 *      Author: Cory Gross, June 9, 2012
 * Description: A set of global utility functions that can be added to to 
 *  ease development of quickly creating 3D demos in Three.JS with all of 
 *  the tools currently at your disposal.
 **/
/** Half window size values used in many graphical calculations */

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var originVector = new THREE.Vector3(0, 0, 0);
var rotVectorX = new THREE.Vector3(1, 0, 0);
var rotVectorY = new THREE.Vector3(0, 1, 0);
var rotVectorZ = new THREE.Vector3(0, 0, 1);

var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiplySelf(object.matrix);        // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.getRotationFromMatrix(object.matrix, object.scale);
}

/** Adds a rotation of rad to obj around world's axis */
var rotWorldMatrix = new THREE.Matrix4();
function rotateWorldAxis(obj, axis, rad) {
    rotWorldMatrix.makeRotationAxis(axis.normalize(), rad);
    obj.updateMatrixWorld();
    rotWorldMatrix.multiplySelf(obj.matrixWorld); // pre-multiply
    obj.rotation.getRotationFromMatrix(rotWorldMatrix, obj.scale);
}

/** Adds a rotation of rad around obj's axis */
var rotObjectMatrix = new THREE.Matrix4();
function rotateObjectAxis(obj, axis, rad) {
    rotObjectMatrix.makeRotationAxis(axis.normalize(), rad);
    obj.matrix.multiplySelf(rotObjectMatrix);
    obj.rotation.getRotationFromMatrix(obj.matrix, obj.scale);
}

function initTrackball(camera, rotate, zoom, pan, damping) {
    var controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = rotate || 1.0;
    controls.zoomSpeed = zoom || 1.2;
    controls.panSpeed = pan || 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = damping || 0.3;
    return controls;
}

function initPanZoom(camera, pan, zoom, damping) {
    var controls = new THREE.PanZoomControls(camera);
    controls.zoomSpeed = zoom || 1.2;
    controls.panSpeed = pan || 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = damping || 0.3;
    controls.noRotate = true;
    return controls;
}

function initFirstPerson(camera, movement, look) {
    var controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = movement || 100;
    controls.lookSpeed = look || 0.01;
    controls.lon = -90;
    return controls;
}

function makeStruct(names) {
    var names = names.split(' ');
    var count = names.length;
    function constructor() {
        for (var i = 0; i < count; i++) {
            this[names[i]] = arguments[i];
        }
    }
    return constructor;
}

/** Lightweight keyboard state object for polling in animation
    logic instead of event logic */
var KeyboardState = function () {
    
    this.keys = [223];
    for (var i = 0; i < 223; i++)
        this.keys[i] = false;
    
    this.alias = {
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        'space': 32,
        'pageup': 33,
        'pagedown': 34,
        'tab': 9
    }

    this.pressed = function (keyString) {
        var keyList = keyString.split(" ");
        for (var i = 0; i < keyList.length; i++) {
            var keyDesc = keyList[i];
            var isPressed;
            if (this.alias[keyDesc] !== -1)
                pressed = this.keys[this.alias[keyDesc]];
            else {
                pressed = this.keys[keyDesc.toUpperCase().charCodeAt(0)];
            }
            if (!pressed) return false;
        }
        return true;
    }
}

/** Creates a grid in Three.JS with lines given a specification based on
    grid size, line spacing, color, position, and rotation. */
function createGrid(gridSize, lineSpacing, hexColor, position, rotation) {
    var grid = new THREE.Object3D();
    lineSpacing = lineSpacing ? lineSpacing : 50;
    gridSize = gridSize ? gridSize : 15;
    var lineLength = lineSpacing * gridSize;
    var lineGeo = new THREE.Geometry();
    lineGeo.vertices.push(new THREE.Vector3(-(lineLength / 2), 0, 0));
    lineGeo.vertices.push(new THREE.Vector3(lineLength / 2, 0, 0));
    var lineMat = new THREE.LineBasicMaterial({ color: (hexColor ? hexColor : 0x000000) });
    for (var i = 0; i < (gridSize + 1) ; i++) {
        var line = new THREE.Line(lineGeo, lineMat);
        line.position.y = -(lineLength / 2) + (i * lineSpacing);
        grid.add(line);
    }
    for (var i = 0; i < (gridSize + 1) ; i++) {
        var line = new THREE.Line(lineGeo, lineMat);
        line.position.x = (lineLength / 2) - (i * lineSpacing);
        line.rotation.z = 90 * Math.PI / 180;
        grid.add(line);
    }
    if (position) {
        grid.position = position;
        if (rotation) grid.rotation = rotation;
    }
    return grid;
}

/** Add a grid specified by size, line spacing, color, position, and rotation
    to Three.JS scene variable */
function addGrid(gridSize, lineSpacing, hexColor, position, rotation) {
    var grid = createGrid(gridSize, lineSpacing, hexColor, position, rotation);
    scene.add(grid);
    return grid;
}

/** Event handler for window 'resize' event */
function resizeRenderer() {
    /** Notify the renderer of the size change */
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    /** Update the camera's aspect ratio */
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    updateHUD();
}

/** Code shortening wrapper functions */
function loadTex(path, map, callback)
{ return THREE.ImageUtils.loadTexture(path, map, callback) }

function loadTexCube(array, map, callback)
{ return THREE.ImageUtils.loadTextureCube(array, map, callback) }

function initHUD() {
    $((function () {
        updateHUD();
    }));
}

function updateHUD() {
    $('.top-center').css('left', (window.innerWidth  - $('.top-center').width()) / 2);
    $('.bottom-center').css('left', (window.innerWidth -  $('.bottom-center').height()) / 2);
    $('#dialog_link').css('left', (window.innerWidth - $('#dialog_link').width()) / 2 - 20);
}

var SliderDialog = function () {

    this.init = function () {
        $(function () {
            $('#widthSliderWidget').css('margin', '10px');
            $('#widthSliderWidget').css('padding', '15px');
            $('#widthSlider').css('width', '70%');

            $('#heightSliderWidget').css('margin', '10px');
            $('#heightSliderWidget').css('padding', '15px');
            $('#heightSlider').css('width', '70%');

            $('#depthSliderWidget').css('margin', '10px');
            $('#depthSliderWidget').css('padding', '15px');
            $('#depthSlider').css('width', '70%');

            $(window).scroll(function () {
                $('#dialog').dialog('option', 'position', 'bottom');
            });

            // Dialog
            $('#dialog').dialog({
                autoOpen: false,
                width: 600,
                position: 'bottom',
                draggable: false,
                Height: 210,
                minHeight: 210
            });

            // Dialog Link
            $('#dialog_link').click(function () {
                $('#dialog').dialog('open');
                return false;
            });

            $('#dialog').on('dialogresize', function () {
                $('#sliderWidget').css('bottom', '10px');
            });

            // Slider
            $('#widthSlider').slider({ min: -0.01, value: 1, max: 2.01, step: 0.01 });
            $('#heightSlider').slider({ min: -0.01, value: 1, max: 2.01 , step: 0.01});
            $('#depthSlider').slider({ min: -500, value: 0, max: 500 });

            $('#widthSliderValue').html($('#widthSlider').slider('value').toString());
            $('#heightSliderValue').html($('#heightSlider').slider('value').toString());
            $('#depthSliderValue').html($('#depthSlider').slider('value').toString());

            $('#widthSlider').on('slide', function () {
                var currentValue = $('#widthSlider').slider('value');
                $('#widthSliderValue').html(currentValue.toString());
            });
            $('#heightSlider').on('slide', function () {
                var currentValue = $('#heightSlider').slider('value');
                $('#heightSliderValue').html(currentValue.toString());
            });
            $('#depthSlider').on('slide', function () {
                var currentValue = $('#depthSlider').slider('value');
                $('#depthSliderValue').html(currentValue.toString());
            });

            $('#dialog_link, ul#icons li').hover(
                function () { $(this).addClass('ui-state-hover'); },
                function () { $(this).removeClass('ui-state-hover'); }
            );
        });
    };
}