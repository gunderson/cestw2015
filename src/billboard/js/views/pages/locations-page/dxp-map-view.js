require("backbone");
require("backbone.layoutmanager");
require('pixi.js');
require("gsap");

var renderer,stage,requestId,view,
	images = {
		bgmap: "assets/images/locations-page/map-20150914.jpg"
	};

var View = Backbone.Layout.extend({
	initialize: function(){
		view = this;
		this.loadPromise = $.Deferred();
	},

	//rendering
	keep:true,
	afterRender: function(){
		stage = new PIXI.Container();
		renderer = PIXI.autoDetectRenderer( window.innerWidth, window.innerHeight, null, false, false ); // width, height, view, antialias, transparent
    	renderer.backgroundColor = 0x3badd1;
		//renderer.resolution = 2

		// add the renderer view element to the DOM
		this.$el.append(renderer.view);

		//setup();
		//loadTextures();
		
		setupSceneMap();
		$(window).on("resize", onResize);
	},

	//defaults
	playing: false,

	//public interface
	play: play,
	stop: stop,
	onResize: onResize,

	//getters & setters
	// get playing(){
	// 	return _playing;
	// },
	// set playing (val){
	// 	(function () {
	// 		var a = val ? this.play() : this.stop();
	// 		_playing = val;
	// 	})(val);
	// }
});

function play(){
	mapIntroTimeline.play(0);
	mapSunTimeline.play(0);
	
	spriteCloud_rain.play();
	spriteCloud_thunder.play();
	
	if (!view.playing) {
		view.playing = true;
		raf();
	}
	return view;
}

function stop(){
	mapIntroTimeline.pause();
	mapSunTimeline.pause(0);
	
	spriteCloud_rain.stop();
	spriteCloud_thunder.stop();
	
	view.playing = false;
	cancelAnimationFrame(requestId); 
	return view;
}


function raf(){
	if (!view.playing) return;
 	update();
	renderer.render(stage);
	requestId = requestAnimationFrame(raf);
}

var dxpmap,
	baseMap,
	cloud0,
	dxps = [
		[-20, 150],
		[50, -20]
	];

function setup(){
	dxpmap = new PIXI.Container();
	stage.addChild(dxpmap);

	baseMap = new PIXI.Sprite();
	baseMap.width = 1920;
	baseMap.height = 1080;
	dxpmap.addChild(baseMap);

	dxps = dxps.map(function(home){
		var dxp = new PIXI.Sprite();
		dxp.position.x = home[0];
		dxp.position.y = home[1];
		dxpmap.addChild(baseMap);
		return dxp;
	});

	cloud0 = new PIXI.Sprite();
	dxpmap.addChild(baseMap);
	onResize();
}

var imagePath = "";
var vizMapGroup,
	toRAD = Math.PI/180,
	mapGroup,
	mapBg,
	mapStates,
	mapGradientTop,
	mapGradientBottom,
	sunGroup, sunFace, sunBeams,
	spriteCloud_rain,
	spriteCloud_thunder;
	
var dxpLocations = [
		// X, Y, TOTAL DXP
		[390, 50, 15],		// WASHINGTON
		[350, 167, 1],		// OREGON
		[374, 547, 17],		// CALIFORNIA
		[624, 133, 1],		// MONTANA
		[676, 281, 1],		// WYOMING
		[865, 685, 26],		// TEXAS
		[904, 142, 1],		// NORTH DAKOTA
		[1048, 457, 1],		// MISSOURI	
		[1060, 700, 8],		// LOUISIANA
		[1122, 390, 1],		// ILLINOIS
		[1122, 634, 2],		// MISSISSIPPI
		[1200, 390, 4],		// INDIANA
		[1230, 262, 8],		// MICHIGAN
		[1368, 440, 2],		// VIRGINIA
		[1592, 94, 1],		// MASSACHUSETS
		[1561, 194, 1],		// NEW HAMPSIRE
		[1565, 245, 7]		// MAINE
		/*
		// NOT USED
		[1042, 551, 1010],	// ARKANSAS
		[1210, 634, 1004]	// ALABAMA
		*/
	],
	dxpCarArray = [];
	
var dxpTreeLocations = [
		[325, 222, "green"],
		[465, 350, "green"],
		[625, 310, "green"],
		[725, 355, "green"],
		[810, 590, "green"],
		[880, 275, "green"],
		[975, 550, "brown"],
		[1000, 155, "green"],
		[1060, 610, "brown"],
		[1120, 230, "brown"],
		[1380, 750, "brown"],
		[1440, 450, "brown"],
		[1470, 260, "green"],
		[1515, 155, "brown"]
	],
	dxpTreeArray = [];

var mapIntroTimeline = new TimelineMax({ paused: true }),
	mapSunTimeline = new TimelineMax({ paused: true });
	
function setupSceneMap(){
	
	var loader = new PIXI.loaders.Loader();
	var imageAssets = {
		"tBg"				: "assets/images/locations-page/background.jpg",
		"tGradientTop"		: "assets/images/locations-page/gradient_top.png",
		"tGradientBottom"	: "assets/images/locations-page/gradient_bottom.png",
		"tMap"				: "assets/images/locations-page/map.png",
		"tDxp"				: "assets/images/locations-page/dxp.png",
		"tTreeGreen"		: "assets/images/locations-page/tree_green.png",
		"tTreeBrown"		: "assets/images/locations-page/tree_brown.png",
		"tSunFace"			: "assets/images/locations-page/sun_face.png",
		"tSunBeams"			: "assets/images/locations-page/sun_beams.png",
		
		"tCloud_rain"       : "assets/images/icons_finished/Cloud_rain.json",
		"tCloud_thunder"    : "assets/images/icons_finished/Cloud_thunder.json"
	};

	_.each(imageAssets, function(filename, key){
		//loader.add(key, imagePath + filename);
		loader.add(key, filename);
	});

	var lp = 0;

	// LOADER HANDLERS --------------------------
	loader.on('progress', function (loader, loadedResource) {


		view.app.trigger("loadProgress",{
			type: "section",
			progress: ++lp / imageAssets.length
		});


  		//console.log("loading: " + loadedResource.url); 
		//console.log('Progress:', loader.progress + '%');
  		//console.log("loading: " + loadedResource.name);
	});
	loader.once('complete',onAssetsLoaded);
	loader.load();
	
	function onAssetsLoaded() {
		vizMapGroup = new PIXI.Container();
		//vizMapGroup.width = window.innerWidth;
		//vizMapGroup.height = window.innerHeight;
		stage.addChild(vizMapGroup);
	
		mapBg = new PIXI.Sprite(loader.resources.tBg.texture);
		mapBg.width =  window.innerWidth;
		mapBg.height = window.innerHeight;
		vizMapGroup.addChild(mapBg);
		
		// MAP CONTAINER
		mapGroup = new PIXI.Container();
		mapGroup.position.x = window.innerWidth/2;
		mapGroup.position.y = window.innerHeight/2;
		mapGroup.pivot.x = 960;
		mapGroup.pivot.y = 540;
		vizMapGroup.addChild(mapGroup);
			// MAP
			mapStates = new PIXI.Sprite(loader.resources.tMap.texture);
			mapStates.width = 1920;
			mapStates.height = 1080;
			mapStates.pivot.x = 960;
			mapStates.pivot.y = 540;
			mapStates.position.x = 960;
			mapStates.position.y = 540;
			mapStates.alpha = 0;
			mapGroup.addChild(mapStates);
			
			// CREATE ALL OF THE TREES
			for (var i = 0; i < dxpTreeLocations.length; i++) {
				tree = new PIXI.Sprite(loader.resources.tTreeGreen.texture);
				tree.alpha = 0;
				tree.pivot.x = 13;
				tree.pivot.y = 55;
				tree.position.x = dxpTreeLocations[i][0] + 13;
				tree.position.y = dxpTreeLocations[i][1] + 55;
				if (dxpTreeLocations[i][2] === "brown") tree.texture = loader.resources.tTreeBrown.texture
				dxpTreeArray.push(tree);
				mapGroup.addChild(tree);
			}
			
			// CREATE ALL OF THE DXPS
			for (var i = 0; i < dxpLocations.length; i++) {
				dxpContainer = new PIXI.Container();
				dxpContainer.position.x = dxpLocations[i][0];
				dxpContainer.position.y = dxpLocations[i][1];
				mapGroup.addChild(dxpContainer);
					dxp = new PIXI.Sprite(loader.resources.tDxp.texture);
					dxp.alpha = 0;
					dxpCarArray.push(dxp);
					dxpContainer.addChild(dxp);
					
					dxpTotal = new PIXI.Text(dxpLocations[i][2], {font: "40px Pizza Press", fill: "white", align: "center"});
					dxpTotal.anchor.x = dxpTotal.anchor.y = 0.5;
					dxpTotal.position.x = 40;
					dxpTotal.position.y = -20;
					dxpTotal.alpha = 0;
					dxpContainer.addChild(dxpTotal);					
					
					// MOUSE STUFF
					dxp.interactive = true;
					dxp.buttonMode = true;
					dxp.defaultCursor = "crosshair";
					dxp.total = dxpLocations[i][2];
					
					dxp.mouseover = function(){
						if (this.position.x != 0) return;
						TweenMax.fromTo( this.parent.children[1], 0.5, { y: -50, alpha: 0 }, { y: -20, alpha: 1, ease: Power4.easeOut });
						TweenMax.to( dxpCarArray, 1, { alpha: 0.3 });
						TweenMax.to( this, 0, { alpha: 1, overwrite: true });
						var target = this.parent.children[1];
						var total = Number(this.total)
						dxpCounter(target, total);
					}
					dxp.mouseout = function(){
						if (this.position.x != 0) return;
						TweenMax.to( this.parent.children[1], 0.5, { alpha: 0 });
						TweenMax.to( dxpCarArray, 1, { alpha: 1 });
					}
			}
			
			// CLOUD RAIN
			var spriteCloud_rainTextureArray = makeSpritesFromSheet("Cloud_rain", 16);
			spriteCloud_rain = new PIXI.extras.MovieClip.fromFrames(spriteCloud_rainTextureArray);
			//spriteCloud_rain.scale.x = spriteCloud_rain.scale.y = assetScale;
			spriteCloud_rain.position.x = 1550;
			spriteCloud_rain.position.y = 420;
			spriteCloud_rain.gotoAndStop(0);
			spriteCloud_rain.animationSpeed = 0.1;
			spriteCloud_rain.alpha = 0;
			mapGroup.addChild(spriteCloud_rain);
			
			// CLOUD THUNDER
			var spriteCloud_thunderTextureArray = makeSpritesFromSheet("Cloud_thunder", 16);
			spriteCloud_thunder = new PIXI.extras.MovieClip.fromFrames(spriteCloud_thunderTextureArray);
			//spriteCloud_thunder.scale.x = spriteCloud_thunder.scale.y = assetScale;
			spriteCloud_thunder.position.x = 1425;
			spriteCloud_thunder.position.y = 650;
			spriteCloud_thunder.gotoAndStop(0);
			spriteCloud_thunder.animationSpeed = 0.1;
			spriteCloud_thunder.alpha = 0;
			mapGroup.addChild(spriteCloud_thunder);
			
			// SUN CONTAINER
			sunGroup = new PIXI.Container();
			sunGroup.position.x = 1300;
			sunGroup.position.y = 0;
			mapGroup.addChild(sunGroup);
				// BEAMS
				sunBeams = new PIXI.Sprite(loader.resources.tSunBeams.texture);
				sunBeams.pivot.x = 75;
				sunBeams.pivot.y = 75;
				sunBeams.alpha = 0;
				sunGroup.addChild(sunBeams);
			
				// FACE
				sunFace = new PIXI.Sprite(loader.resources.tSunFace.texture);
				sunFace.pivot.x = 75;
				sunFace.pivot.y = 75;
				sunFace.alpha = 0;
				sunGroup.addChild(sunFace);
			
		mapGradientTop = new PIXI.Sprite(loader.resources.tGradientTop.texture);
		mapGradientTop.width = window.innerWidth;
		mapGradientTop.height = 650;
		vizMapGroup.addChild(mapGradientTop);
		
		mapGradientBottom = new PIXI.Sprite(loader.resources.tGradientBottom.texture);
		mapGradientBottom.width = window.innerWidth;
		mapGradientBottom.height = 500;
		mapGradientBottom.pivot.y = 500;
		mapGradientBottom.position.y = window.innerHeight;
		vizMapGroup.addChild(mapGradientBottom);
		
		// INTRO ANIMATION
		mapIntroTimeline.fromTo( "#dxp-map", 1.5, { autoAlpha: 0 }, { autoAlpha: 1, ease: Linear.easeNone }, 0);
		mapIntroTimeline.fromTo( mapStates, 1.5, { scaleX: .75, scaleY: .75, alpha: 0 }, { scaleX: 1, scaleY: 1, alpha: 1, ease: Power4.easeInOut }, .5);
		mapIntroTimeline.staggerFromTo( dxpTreeArray, 1, { scaleX: 0, scaleY: 0, alpha: 0 }, { scaleX: 1, scaleY: 1, alpha: 1, ease: Power4.easeOut }, 0.05, 1.5);
		mapIntroTimeline.staggerFromTo( dxpCarArray, 1, { x: 100, alpha: 0 }, { x: 0, alpha: 1, ease: Power4.easeOut }, 0.05, 2);
		mapIntroTimeline.fromTo( sunBeams, 1.5, { alpha: 0 }, { alpha: 1, ease: Power4.easeInOut }, .75);
		mapIntroTimeline.fromTo( sunFace, 1.5, { alpha: 0 }, { alpha: 1, ease: Power4.easeInOut }, .75);
		mapIntroTimeline.fromTo( spriteCloud_rain, 1.5, { alpha: 0 }, { alpha: 1, ease: Power4.easeInOut }, 1);
		mapIntroTimeline.fromTo( spriteCloud_thunder, 1.5, { alpha: 0 }, { alpha: 1, ease: Power4.easeInOut , onComplete: function(){
			view.trigger("introAnimationComplete");
		}}, 1.25);
		// SUN ROTATION ANIMATION
		mapSunTimeline.fromTo( sunBeams, 10, { rotation: 0 }, { rotation: (360 * toRAD), ease: Linear.easeNone, repeat: -1 }, 0);
		
		onResize();
		view.loadPromise.resolve();
	}
	
}

function dxpCounter(target, total) {
	var startNumber = { dxpNumber: 1 },
	endNumber = total;
	TweenMax.to(startNumber, 1, { dxpNumber: endNumber, roundProps:"dxpNumber", ease: Power4.easeOut,
		onUpdate: function () {
			target.text = startNumber.dxpNumber;
		}
	});	
}

function update(){
}

function onResize(){
	/*
	var w = window.innerWidth,
		h = window.innerHeight,
		aspect = w/h;
	if (aspect > 16/9){
		//it's too tall - fit to width
		dxpmap.width = w;
		dxpmap.height = w * 9 / 16;
		dxpmap.position.x = 0;
		dxpmap.position.y = (h * 0.5) - (dxpmap.height * 0.5);
	} else {
		//it's too wide - fit to height
		dxpmap.height = h;
		dxpmap.width = h * 16 / 9;
		dxpmap.position.x = (w * 0.5) - (dxpmap.width * 0.5);
		dxpmap.position.y = 0;
	}
	*/
	
	// RESIZE & REPOSITION MAP ASSETS
	var windowFullWidth = window.innerWidth,
		windowFullHeight = window.innerHeight,
		windowHalfWidth = windowFullWidth / 2,
		windowHalfHeight = windowFullHeight / 2,
		ratioSiteWidth = Math.min(windowFullWidth, 1920),
		ratioSiteHeight = Math.min(windowFullHeight, 1080),
		ratioMap = Math.min((ratioSiteWidth/1920), (ratioSiteHeight/1080));
	
	renderer.resize( windowFullWidth, windowFullHeight );
	
	mapGroup.scale.x = mapGroup.scale.y = ratioMap;
	
	mapBg.width = windowFullWidth;
	mapBg.height = windowFullHeight;
	
	mapGroup.position.x = windowFullWidth/2;
	mapGroup.position.y = windowFullHeight/2;
	
	mapGradientTop.width = windowFullWidth;
	mapGradientBottom.width = windowFullWidth;
	mapGradientBottom.position.y = windowFullHeight;
	
}

function makeSpritesFromSheet(name, totalFrames, firstFrame){
	firstFrame = firstFrame || 0;
	return _.map(new Array(totalFrames), function(e,i){
		return name + "_" + (firstFrame + i);
	}); 
}

function loadTextures(){
	view.app.media.get("images")
		.once("dxp-map:ready", function(){
			applyTextures();
			view.loadPromise.resolve();
		})
		.add([
			{
				sources: [images.bgmap],
				id: "bgmap",
				group: "dxp-map"
			}
		]);
}

function applyTextures(){
	
	var baseMapTexture = PIXI.Texture.fromImage(images.bgmap);
	baseMap.texture = baseMapTexture;
	/*
	var dxpTexture = PIXI.Texture.fromImage("assets/images/locations-page/map-20150914.jpg");
	dxps.foreach(function(dxp){
		dxp.setTexture(dxpTexture);
	});

	var cloud0Texture = PIXI.Texture.fromImage("assets/images/locations-page/map-20150914.jpg");
	cloud0.setTexture(cloud0Texture);
	*/
}

function triggerCloud0(){
	TweenMax.FromTo(cloud0, 22, {
		x: -cloud0.width,
		y: 540
	},
	{
		x: 1920,
		y: 540
	});
}

module.exports = View;