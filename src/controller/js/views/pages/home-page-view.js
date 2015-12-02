require("backbone");
require("backbone.layoutmanager");
require('pixi.js');
require("gsap");

var AbstractPage = require("./Page-view");
var ps;
var view;
var useSound = false;

var $html = $("html");

// PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;


var hasPointer;
var app = null;
var page = null;
var scenes = new Array(12);
var assetSize;
var assetScale;
var imagePath;




//var imagePath = "assets/images/";
//var assetScale = 1;
var carStarted = false;

var Page = AbstractPage.extend({
	row:0,
	col:0,
	keep:true,
	el: "#home-page",
	isSetup: false,
	loaded: false,
	events: {
	},
	initialize: function(){ 
		view = this;
		if (page){
			throw(new Error("Home Page instance already exists"));
		} else {
			page = this;
		}


		assetSize = window.assetSize;


		if ($.browser.name === "safari" && $.browser.mobile === true){
			assetSize = window.assetSize = 960;
			assetRatio = window.assetRatio = assetSize / 1920;
		}

		assetScale = 1 / window.assetRatio;
		imagePath = window.cdn + "assets/images_sized/" + assetSize;



		this.loadPromise = new $.Deferred();

		AbstractPage.prototype.initialize.call(this);

		//make Scenes
		var views = this.views = {};
		_.each(scenes, function(o,i){
			views["#" + i] = scenes[i] = new Scene({
				sceneId: i,
				route: i.toString()
			});
		});

		stage = new PIXI.Container();
		renderer = PIXI.autoDetectRenderer( window.innerWidth, window.innerHeight, null, true, false ); // width, height, view, antialias, transparent
    	renderer.backgroundColor = 0x000000;
		// add the renderer view element to the DOM
		this.$(".content").append(renderer.view);
		
		
		makeSetupFunctions();

		// FOR LATER 
		//renderer.resolution = 2
		this.onFirstInteraction = _.bind(this.onFirstInteraction, this);

		this.onDocumentTouchStart = _.throttle(onDocumentTouchStart, 300);

	},
	setApp: function(_app){
		AbstractPage.prototype.setApp.apply(this, arguments);
		app = _app;
	},
	// RENDERING
	beforeRender: function(){
		setupScene();
		//loadEverything(showEverything);
		
	},
	loadAssets: function(){
		// turn off sound
		if (useSound && $html.hasClass("mutable")){
			app.media.get("sounds").add([
				{
	                id: "car-bg",
	                loop: true,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/car-bg.mp3", "sfx/car-bg.ogg"],
	                volume: 0.2,
	                filesize: 1800
	            },{
	                id: "car-start",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/car-start.mp3", "sfx/car-start.ogg"],
	                volume: 0.2,
	                filesize: 1800
	            },{
	                id: "warming-door",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/warming-door.mp3", "sfx/warming-door.ogg"],
	                volume: 0.2,
	                filesize: 1800
	            },{
	                id: "day-bg",
	                loop: true,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/day-bg.mp3", "sfx/day-bg.ogg"],
	                volume: 0.4,
	                filesize: 1800
	            },{
	                id: "dog",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/dog.mp3", "sfx/dog.ogg"],
	                volume: 0.6,
	                filesize: 1800
	            },{
	                id: "donny",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/donny.mp3", "sfx/donny.ogg"],
	                volume: 0.6,
	                filesize: 1800
	            },{
	                id: "noid",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/noid.mp3", "sfx/noid.ogg"],
	                volume: 0.6,
	                filesize: 1800
	            },{
	                id: "harbor",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/harbor.mp3", "sfx/harbor.ogg"],
	                volume: 0.6,
	                filesize: 1800
	            },{
	                id: "crickets",
	                loop: true,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/crickets.mp3", "sfx/crickets.ogg"],
	                volume: 0.4,
	                filesize: 1800
	            },{
	                id: "redoctober",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/redoctober.mp3", "sfx/redoctober.ogg"],
	                volume: 0.6,
	                filesize: 1800
	            },{
	                id: "rain",
	                loop: true,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/rain.mp3", "sfx/rain.ogg"],
	                volume: 1,
	                filesize: 1800
	            },{
	                id: "camera",
	                loop: false,
	                preload: "auto",
	                group: "story",
	                sources: ["sfx/camera.mp3", "sfx/camera.ogg"],
	                volume: 1,
	                filesize: 1800
	            },

			]);
		}



		setup();
	},
	afterRender: function(){
		// Wrap text for animation ---------------------
		
		this.$("h1, h2, h3").each(function(i, el){
			var $el = $(el);
			var text = $el.text();
			var lines = _.map(text.split("\n"), function(line){
				var words = _.map(line.split(" "), function(word){			
					var letters = _.map(word.split(""), function(letter){
						return "<span class=\"at-letter\">" + letter + "</span>";
					}).join("");
					return "<span class=\"at-word\">" + letters + "</span>";
				}).join(" ");
				return words;
			}).join("<br/>\n");
			$el.html(lines);
		});
		$vignette = $(".vignette");
		$vignette_top = $(".vignette-top");
		$vignette_bottom = $(".vignette-bottom");
	},
	onResize: function () {
	},
	// EVENT HANDLERS
	setupFirstInteraction: function(){
		this.$el
			.one("mousedown", this.onFirstInteraction)
			.one("touchstart", this.onFirstInteraction);
		app.once("vscroll", this.onFirstInteraction);
	},
	onFirstInteraction: function(){
		this.$el
			.off("mousedown", this.onFirstInteraction)
			.off("touchstart", this.onFirstInteraction);
		app.off("vscroll", this.onFirstInteraction);
	},
	// TRANSITIONS
	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
		requestId = requestAnimationFrame( animate );

		$(window).on("resize", onResize);
	},
	transitionInComplete: function(){
		this.$el.on("mousedown", onDocumentMouseDown);
		
		this.$el.on('touchstart', this.onDocumentTouchStart);
    	this.$el.on('touchmove', onDocumentTouchMove);
		
    	// this.el.addEventListener('mousewheel', onDocumentMouseWheel);
    	this.app.on("vscroll", onDocumentMouseWheel);
		document.addEventListener('keydown', onDocumentKeyDown);

		this.setupFirstInteraction();
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		cancelAnimationFrame(requestId);
		TweenMax.to( ["#scene-menu", "header #main-logo"], 1, { autoAlpha: 1 });

		this.$el.off("mousedown", onDocumentMouseDown);
		
		this.$el.off('touchstart', this.onDocumentTouchStart);
    	this.$el.off('touchmove', onDocumentTouchMove);
			
    	// this.el.removeEventListener('mousewheel', onDocumentMouseWheel);
    	this.app.off("vscroll", onDocumentMouseWheel);
		document.removeEventListener('keydown', onDocumentKeyDown);
		$(window).off("resize", onResize);
		app.media.pauseSound("story");
	},
	transitionOutComplete: function(){
		console.log("transitionOutComplete", requestId);
	}
});

var Scene = AbstractPage.extend({
	render: false,
	imageAssets: {},
	hasLoaded: false,
	assetList: [],
	numLoaded: 0,
	invisibles: [],
	initialize: function(options){
		AbstractPage.prototype.initialize.call(this);
		_.extend(this, options);

		this.loadDeferral = new $.Deferred();
		this.loader = new PIXI.loaders.Loader();
		this.loader.sceneId = this.sceneId;
		this.invisibles = [];
	},
	setup: function(){},
	transitionIn: function(){
		gotoScene(this.sceneId);
	},
	transitionOut: function(){},
});


function unhideOneChildEachFrame(parent, callback){
	//if something needs to unbuffer this frame, call again next frame
	if (parent.unhideNextChild(true)){
		requestAnimationFrame(function(){
			unhideOneChildEachFrame(parent, callback);
		});
	} else {
		// you're done!
		if (typeof callback === "function") callback();
	}
}

//the return value is the last child to be unbuffered, or undefined if none need to unbuffer
PIXI.Container.prototype.unhideNextChild = function(deep){
	var child;
	// if no children, an optimization to end early
	if (this.children.length === 0) return undefined;

	// if I have a child to buffer
	if (this.childVisibilityBuffer && this.childVisibilityBuffer.length > 0){
		// unbuffer a buffered child
		child = this.childVisibilityBuffer.pop();
		child.visible = (child.__bVisible === false)? false : true;
		delete child.__bVisible;
		return child;
	}
	
	// if asked to, try to unbuffer my children
	if (deep){
		for (var i = 0, endi = this.children.length; i<endi; i++){
			child = this.children[i];
			//if the child returns true, end the recurrsion
			var unbufferredChild = child.unhideNextChild(true);
			if (unbufferredChild) return unbufferredChild;
		}
	}	
	
	// else i have children, but none to unbuffer
	return undefined;
};

PIXI.Container.prototype.showChildren = function(deep){
	if (this.childVisibilityBuffer){
		var child;
		if (deep){
			this.childVisibilityBuffer.forEach(function(){
				child.showChildren(deep);
			});
		}
		child.visible = (child.__bVisible === false)? false : true;
		delete child.__bVisible;
		this.childVisibilityBuffer = [];
	}
};

PIXI.Container.prototype.hideChildren = function(deep){
	this.childVisibilityBuffer = this.children.slice();
	var numChildren = this.children.length;
	for (var i = 0; i<numChildren; i++){
		child = this.children[i];
		if (deep){
			// attempt to buffer it's children
			child.hideChildren(deep);
		}
		// if it's already buffered itself, ignore it
		if (child.hasOwnProperty("__bVisible")) continue;
		// otherwise buffer
		child.__bVisible = child.visible;
		child.visible = false;
	}
};





var stage,
	renderer,
	requestId,
	// globalLoader = new PIXI.loaders.Loader(),
	masterAssetList = [];
	
var inTransition = true,
	mouseX = 0,
	mouseXOnMouseDown = 0,
	currentX = 0,
	currentXPos = 0,
	targetX = 0,
	targetXOnMouseDown = 0,
	minTargetX = 0,
	maxTargetX = 49000,		// VALUE CHANGES BASED UPON RESIZE
	currentTireRotation = 0,
	windowFullWidth = window.innerWidth,
	windowFullHeight = window.innerHeight,
	windowHalfWidth = windowFullWidth / 2,
	windowHalfHeight = windowFullHeight / 2,
	ratioSiteWidth,
	ratioSiteHeight,
	ratioPercentage,
	minSiteWidth,
	minSiteHeight,
	windowFullWidthDifference,
	windowFullHeightDifference,
	toRAD = Math.PI/180,
	isMouseDown = false;
	
var scene0Group,			// INTRO SCENE
	scene0Extra,
	scene0Bg,
	scene0Sun,
	scene0CoverLeft,
	scene0CoverRight,
	scene0Ship,
	scene0City,
	scene0Water,
	scene0Boat,
	scene0Airplane,
	scene0Car,
	scene0CarBase,
	scene0CarShadow,
	scene0CarOven,
	scene0Swipe,
	scene0Logo,
	warmingOvenArray = [],
	scene0Active = false,
	scene0Loaded = false;
	
var scene1Group,			// DAY DRIVING DOMINOES
	scene1SkyExtra,
	scene1SkyExtraDay,
	scene1Sky,
	scene1Sun,
	scene1SunGlow,
	scene1City,
	scene1Ocean,
	scene1OceanObjects,
	scene1StreetObjects,
	scene1Street,
	scene1Dominos,
	scene1Car,
	scene1CarReflections,
	scene1CarWheels,
	scene1CarWheelAsset1,
	scene1CarWheelAsset2,
	scene1Trees,
	scene1Active = false,
	scene1Loaded = false;

var scene2Group,			// WARMING OVEN
	scene2Bg,
	scene2Car,
	scene2WarmingOven,
	ovenMovieClipArray = [],
	scene2Active = false,
	scene2Loaded = false;
	
var scene3Group,			// DAY DRIVING CITY
	scene3SkyExtra,
	scene3SkyExtraDay,
	scene3SkyExtraDayAsset,
	scene3Sky,
	scene3SkyAsset,
	scene3Sun,
	scene3City,
	scene3Ocean,
	scene3OceanObjects,
	scene3Street,
	scene3StreetAsset,
	scene3Buildings,
	scene3Car,
	scene3CarBody,
	scene3CarReflections,
	scene3CarWheels,
	scene3Trees,
	scene3STreesAsset,
	scene3Active = false,
	scene3Loaded = false;
	
var scene4Group,			// TOP - SECURED ESSENTIALS
	scene4Extra,
	scene4ExtraAsset,
	scene4Bg,
	scene4BgAsset,
	scene4SidewalkTop,
	scene4SidewalkTopAsset,
	scene4SidewalkBottom,
	scene4SidewalkBottomAsset,
	scene4Car,
	scene4CarBody, scene4CarBag1, scene4CarBag2, scene4CarFlashlight, scene4CarNapkins, scene4CarSalad, scene4CarSauce1, scene4CarSauce2, scene4CarSoda, scene4CarUtensils, scene4CarWindshield,
	scene4Active = false,			
	scene4Loaded = false;
	
var scene5Group,			// DRIVE - DAY TO NIGHT		
	scene5SkyExtra, scene5SkyExtraDay, scene5SkyExtraNight,
	scene5Sky, scene5SkyDay, scene5SkyNight,
	scene5Sun, scene5SunDay, scene5SunNight,
	scene5City, scene5CityDay, scene5CityNight,
	scene5Ocean, scene5OceanDay, scene5OceanNight,
	scene5OceanObjects,
	scene5Street, scene5StreetDay, scene5StreetNight,
	scene5Sidewalk, scene5Donny,
	scene5Buildings, scene5BuildingsDay, scene5BuildingsNight,
	scene5Car,
	scene5CarReflections,
	scene5CarWheels,
	scene5CarBodyDay, scene5CarWheel1Day, scene5CarWheel2Day,
	scene5CarBodyNight, scene5CarWheel1Night, scene5CarWheel2Night, scene5Headlights,
	scene5Trees, scene5TreesDay, scene5TreesNight,
	scene5GlowDay, scene5GlowNight,
	scene5Active = false,
	scene5Loaded = false;
	
var scene6Group,			// OUT FOR DELIVERY & DXP DRIVER	
	scene6Bg,
	scene6Sky,
	scene6Bridge,
	scene6Ocean,
	scene6City,
	scene6Car,
	scene6Glow,
	scene6Active = false,
	scene6Loaded = false;
	
var scene7Group,			// DRIVE - NIGHT #DXP
	scene7SkyExtra, scene7SkyExtraNight,
	scene7Sky,
	scene7Sun,
	scene7City,
	scene7Ocean,
	scene7OceanObjects,
	scene7Street,
	scene7Buildings,
	scene7NightCar,
	scene7NightCarReflections,
	scene7Car,
	scene7CarBody,
	scene7Headlights,
	scene7Trees,
	scene7DxpBubble,
	scene7DxpFlash,
	scene7Active = false,
	scene7Loaded = false;
	
var scene8Group, scene8Extra, scene8Bg,	scene8Car, scene8Dots, scene8Icons, scene8Glow, scene8Location,
	scene8Active = false,
	scene8Loaded = false;
	
var scene9Group,			// DRIVE - NIGHT NEIGHBORHOOD
	scene9Sky, scene9SkyExtra, scene9SkyExtraNight, scene9Sun, scene9City, scene9Ocean, scene9OceanObjects, scene9Street, scene9Buildings, scene9Customer, 
	scene9NightCar, scene9NightCarReflections, scene9Car, scene9CarBody, scene9Headlights, scene9Rain,
	scene9Active = false,
	scene9Loaded = false;
	
var scene10Group,			// SIDE ZOOM - DELIVERY PATH ILLUMINTATOR
	scene10Extra,
	scene10Bg,
	scene10Puddles,
	scene10CarLight,
	scene10Car,
	scene10Glow,
	scene10Active = false,
	scene10Loaded = false;
	
var scene11Group,			// DRIVE - FINAL SCENE
	scene11SkyExtra, scene11SkyExtraNight,	
	scene11Sky,
	scene11Sun,
	scene11City,
	scene11Ocean,
	scene11OceanObjects,
	scene11Street,
	scene11Buildings,
	scene11NightCar,
	scene11NightCarReflections,
	scene11Car,
	scene11CarBody,
	scene11Headlights,
	scene11Trees,
	scene11Active = false,
	scene11Loaded = false;
	
var transitionTree,
	transitionBird;

var vizGroup,
	vizGroupCenter,
	transitionMask1,
	transitionMask2,
	transitionMask3,
	transitionMask4,
	transitionMask5,
	
	transitionGroup,
	transitionRectMain,
	coverupGroup;
	
var scene0Width,
	scene1Width,
	scene2Width,
	scene3Width,
	scene4Width,
	scene5Width,
	scene6Width,
	scene7Width,
	scene8Width,
	scene9Width,
	scene10Width,
	scene11Width;
	
var scene1WidthContainer = 3400,	// USED TO DICTATE THE ACTUAL SIZE/WIDTH OF THE BACKGROUND ASSETS
	scene3WidthContainer = 3400,
	scene5WidthContainer = 3400,
	scene7WidthContainer = 3400,
	scene9WidthContainer = 3400,
	scene11WidthContainer = 3400;

var cloudGroupBufferLeft = -500,
	cloudGroupBufferRight = 3000,
	oceanGroupBufferLeft = -750,
	oceanGroupBufferRight = 3500,
	buildingGroupBufferLeft = -1000,
	buildingGroupBufferRight = 6000;
	
var maskZone1X,
	maskZone2X,
	maskZone3X,
	maskZone4X,
	maskZone5X,
	maskZone1On,
	maskZone1Off,
	maskZone2On,
	maskZone2Off,
	maskZone3On,
	maskZone3Off,
	maskZone4On,
	maskZone4Off,
	maskZone5On,
	maskZone5Off;
	
var spriteB747, spriteB777, spriteShip, spriteSailboat, spriteBiker, spriteTalking, spriteDonny, spriteVictory_dance, spriteRed_October, spritePiper, spriteYacht, spriteBird1, spriteBird2, spriteSpeedboat, spriteTraffic_light, spriteTraffic_light2, spriteTaking_photo, spritepuddle1, spritepuddle2, spritepuddle3, spriteJogger, spriteWaving, spriteWalking_dog, spriteWalking, spriteWalking_waving, spritePhone, spriteNoid, spriteDrinking, spriteNewspaper, spriteOld_car;
	
var maskZone1Placement = "left",
	maskZone2Placement = "left",
	maskZone3Placement = "left",
	maskZone4Placement = "left",
	maskZone5Placement = "left";

var scene0Timeline = new TimelineMax({ paused: true }),
	scene1Timeline = new TimelineMax({ paused: true }),
	scene3Timeline = new TimelineMax({ paused: true }),
	scene4Timeline = new TimelineMax({ paused: true }),
		scene4BirdTimeline = new TimelineMax({ paused: true, repeat: -1 }),
	scene5Timeline = new TimelineMax({ paused: true }),
	scene7Timeline = new TimelineMax({ paused: true }),
	scene9Timeline = new TimelineMax({ paused: true }),
		scene9UfoInTimeline = new TimelineMax({ paused: true }),
	scene11Timeline = new TimelineMax({ paused: true });

var currentSceneId = 0,
	previousSceneId = 0,
	currentScenePercentage;
	
var sceneArray = []
var safeAreaMarker;

function setup(){
	makeSetupFunctions();

	transitionalOverlays = _.map(scenes, function(){
		var g = new PIXI.Graphics()
			.beginFill(0,0.4)
			.drawRect(0,0,128, 128)
			.endFill();

		// NEED TO MAKE SURE THESE SCALE ON RESIZE TO MATCH WINDOW HEIGHT/WIDTH ON DESKTOP. CURRENTELY ARE TOO SMALL ON LARGER RESOLUTIONS
		g.position.x = 0;
		g.position.y = -3000;
		g.pivot.x = 0;
		g.pivot.y = 0;
		g.width = 2650;
		g.height = 6000;
		g.alpha = 0;

		return g;
	});

	preloadScenes({
		loadGroup: loadGroups.shift(),
		loadType: "site",
		silentLoad: false
	})
	.then(initEverything)
	.then(function(){
		// safeAreaMarker = new PIXI.Graphics()
		// 	.beginFill(0xff00ff,0.2)
		// 	.drawRect(0,0,1024, 1024)
		// 	.endFill();
		// safeAreaMarker.pivot.x = 512;
		// safeAreaMarker.pivot.y = 1024;
		// safeAreaMarker.position.x = minSiteWidth * 0.5;
		// safeAreaMarker.position.y = minSiteHeight;
  //   	vizGroup.addChild(safeAreaMarker);

  //   	var markerCheck = new PIXI.Graphics()
		// 	.beginFill(0x00ffff,0.2)
		// 	.drawRect(0,0,100, 100)
		// 	.endFill();
		// markerCheck.pivot.x = 0;
		// markerCheck.pivot.y = 0;
		// markerCheck.position.x = 0;
		// markerCheck.position.y = 0;
  //   	safeAreaMarker.addChild(markerCheck);

	});
	page.isSetup = true;
}

function calculateWidths() {
	scene0Width = window.innerWidth;						// INTRO AREA
	scene1Width = 4000;
	scene2Width = Math.min((windowFullWidth * 1.5), 4000);	// MASKED AREA
	scene3Width = 4000;
	scene4Width = Math.min((windowFullWidth * 3), 4000);	// MASKED AREA
	scene5Width = 4000;
	scene6Width = 6000;										// MASKED AREA
	scene7Width = 4000;
	scene8Width = Math.min((windowFullWidth * 1.5), 4000);	// MASKED AREA
	scene9Width = 4000;
	scene10Width = Math.min((windowFullWidth * 1.5), 4000);	// MASKED AREA
	scene11Width = 4000;
	maxTargetX = scene1Width + scene2Width + scene3Width + scene4Width + scene5Width + scene6Width + scene7Width + scene8Width + scene9Width + scene10Width + scene11Width;
}

function calculatePositions() {
	maskZone1X = 0 - scene1Width - scene2Width;
	maskZone2X = maskZone1X - (scene3Width + scene4Width);
	maskZone3X = maskZone2X - (scene5Width + scene6Width);
	maskZone4X = maskZone3X - (scene7Width + scene8Width);
	maskZone5X = maskZone4X - (scene9Width + scene10Width);
	
	maskZone1On = maskZone1X + scene2Width;
	maskZone1Off = maskZone1X;
	maskZone2On = maskZone2X + scene4Width;
	maskZone2Off = maskZone2X;
	maskZone3On = maskZone3X + scene6Width;
	maskZone3Off = maskZone3X;
	maskZone4On = maskZone4X + scene8Width;
	maskZone4Off = maskZone4X;
	maskZone5On = maskZone5X + scene10Width;
	maskZone5Off = maskZone5X;
}

function redrawMasks() {
	calculateWidths();
	calculatePositions();

	transitionMask1.clear();
	transitionMask1.beginFill(0x00FF00);
	transitionMask1.drawRect(0, 0, windowFullWidth, windowFullHeight);
	transitionMask1.endFill();
	if (maskZone1Placement === "left") transitionMask1.position.x = -windowFullWidth;
	if (maskZone1Placement === "center") transitionMask1.position.x = 0;
	if (maskZone1Placement === "right") transitionMask1.position.x = windowFullWidth;
	
	transitionMask2.clear();
	transitionMask2.beginFill(0x00FF00);
	transitionMask2.drawRect(0, 0, windowFullWidth, windowFullHeight);
	transitionMask2.endFill();
	if (maskZone2Placement === "left") transitionMask2.position.x = -windowFullWidth;
	if (maskZone2Placement === "center") transitionMask2.position.x = 0;
	if (maskZone2Placement === "right") transitionMask2.position.x = windowFullWidth;
	
	transitionMask3.clear();
	transitionMask3.beginFill(0x00FF00);
	transitionMask3.drawRect(0, 0, windowFullWidth, windowFullHeight);
	transitionMask3.endFill();
	if (maskZone3Placement === "left") transitionMask3.position.x = -windowFullWidth;
	if (maskZone3Placement === "center") transitionMask3.position.x = 0;
	if (maskZone3Placement === "right") transitionMask3.position.x = windowFullWidth;

	transitionMask4.clear();
	transitionMask4.beginFill(0x00FF00);
	transitionMask4.drawRect(0, 0, windowFullWidth, windowFullHeight);
	transitionMask4.endFill();
	if (maskZone4Placement === "left") transitionMask4.position.x = -windowFullWidth;
	if (maskZone4Placement === "center") transitionMask4.position.x = 0;
	if (maskZone4Placement === "right") transitionMask4.position.x = windowFullWidth;

	transitionMask5.clear();
	transitionMask5.beginFill(0x00FF00);
	transitionMask5.drawRect(0, 0, windowFullWidth, windowFullHeight);
	transitionMask5.endFill();
	if (maskZone5Placement === "left") transitionMask5.position.x = -windowFullWidth;
	if (maskZone5Placement === "center") transitionMask5.position.x = 0;
	if (maskZone5Placement === "right") transitionMask5.position.x = windowFullWidth;
}


function setupScene(){
	vizGroup = new PIXI.Container();
	vizGroup.width = 5000;
	vizGroup.height = 1080;
	vizGroup.position.x = 0;
	vizGroup.pivot.x = 0;
	vizGroup.pivot.y = 1080;
    stage.addChild(vizGroup);

	vizGroupCenter = new PIXI.Container();
	vizGroupCenter.width = 5000;
	vizGroupCenter.height = 1080;
	vizGroupCenter.position.x = 0;
	vizGroupCenter.pivot.x = 0;
	vizGroupCenter.pivot.y = 540;
    stage.addChild(vizGroupCenter);

	scene11Group = new PIXI.Container();
	scene11Group.height = 1080;
    vizGroup.addChild(scene11Group);
	
	scene9Group = new PIXI.Container();
	scene9Group.height = 1080;
    vizGroup.addChild(scene9Group);
	
	scene7Group = new PIXI.Container();
	scene7Group.height = 1080;
    vizGroup.addChild(scene7Group);
	
	scene5Group = new PIXI.Container();
	scene5Group.height = 1080;
    vizGroup.addChild(scene5Group);
	
	scene3Group = new PIXI.Container();
	scene3Group.height = 1080;
    vizGroup.addChild(scene3Group);
	
	scene1Group = new PIXI.Container();
	scene1Group.height = 1080;
    vizGroup.addChild(scene1Group);
	
	// TRANSITION CONTAINER & ELEMENTS
	transitionGroup = new PIXI.Container();
    stage.addChild(transitionGroup);
	
	// THESE SECTIONS NEED TO GO ON TOP OF EVERYTHING ELSE BECAUSE THEY ARE MASKED
	scene2Group = new PIXI.Container();
	scene2Group.height = 1080;
    vizGroup.addChild(scene2Group);
	
	scene4Group = new PIXI.Container();
	scene4Group.height = 1080;
    vizGroupCenter.addChild(scene4Group);
	 
	scene6Group = new PIXI.Container();
	scene6Group.height = 1080;
    vizGroup.addChild(scene6Group);
	
	scene8Group = new PIXI.Container();
	scene8Group.height = 1080;
    vizGroupCenter.addChild(scene8Group);
	
	scene10Group = new PIXI.Container();
	scene10Group.height = 1080;
    vizGroupCenter.addChild(scene10Group);
	
	scene0Group = new PIXI.Container();
	scene0Group.height = 1080;
	scene0Group.pivot.y = 1080;
	scene0Group.position.y = 1080;
    vizGroup.addChild(scene0Group);
	
	// SETUP MASKS
	transitionMask1 = new PIXI.Graphics();
	transitionGroup.addChild(transitionMask1);
	scene2Group.mask = transitionMask1;
	
	transitionMask2 = new PIXI.Graphics();
	transitionGroup.addChild(transitionMask2);
	scene4Group.mask = transitionMask2;
	
	transitionMask3 = new PIXI.Graphics();
	transitionGroup.addChild(transitionMask3);
	scene6Group.mask = transitionMask3;
	
	transitionMask4 = new PIXI.Graphics();
	transitionGroup.addChild(transitionMask4);
	scene8Group.mask = transitionMask4;
	
	transitionMask5 = new PIXI.Graphics();
	transitionGroup.addChild(transitionMask5);
	scene10Group.mask = transitionMask5;
	
	redrawMasks();
	
	// TRANSITION RECTANGLES
	transitionRectMain = new PIXI.Graphics();
	transitionRectMain.beginFill(0x000000);
	transitionRectMain.drawRect(0, 0, window.innerWidth, window.innerHeight);
	transitionRectMain.endFill();
	transitionGroup.addChild(transitionRectMain);
	
	// TRANSITIONAL COVERUP GROUP TO HIDE MASKS
	coverupGroup = new PIXI.Container();
	coverupGroup.width = 5000;
	coverupGroup.height = 1080;
	coverupGroup.position.x = 0;
	coverupGroup.pivot.x = 0;
	coverupGroup.pivot.y = 1080;
    stage.addChild(coverupGroup);
	
	// TEMP IDENTIFIERS
	scene0Group.name = "scene0Group";
	scene1Group.name = "scene1Group";
	scene2Group.name = "scene2Group";
	scene3Group.name = "scene3Group";
	scene4Group.name = "scene4Group";
	scene5Group.name = "scene5Group";
	scene6Group.name = "scene6Group";
	scene7Group.name = "scene7Group";
	scene8Group.name = "scene8Group";
	scene9Group.name = "scene9Group";
	scene10Group.name = "scene10Group";
	scene11Group.name = "scene11Group";
	
	hideGroup(scene0Group);
	hideGroup(scene1Group);
	hideGroup(scene2Group);
	hideGroup(scene3Group);
	hideGroup(scene4Group);
	hideGroup(scene5Group);
	hideGroup(scene6Group);
	hideGroup(scene7Group);
	hideGroup(scene8Group);
	hideGroup(scene9Group);
	hideGroup(scene10Group);
	hideGroup(scene11Group);
	
	onResize();
}

function gotoScene(sceneId) {
	if (inTransition === true) return;

	var jumpTargetX = 0;
	switch (sceneId){
		case 0:
			jumpTargetX = 0;
			break;
		case 1:
			jumpTargetX = window.innerWidth;
			break;
		case 2:
			jumpTargetX = -maskZone1On + 100;
			break;
		case 3:
			jumpTargetX = -maskZone1X + window.innerWidth;
			break;
		case 4:
			jumpTargetX = -maskZone2X - 500;
			break;
		case 5:
			jumpTargetX = -maskZone2X + window.innerWidth;
			break;
		case 6:
			jumpTargetX = -maskZone3On + 100;
			break;
		case 7:
			jumpTargetX = -maskZone3X - window.innerWidth;
			break;
		case 8:
			jumpTargetX = -maskZone4On + 100;
			break;
		case 9:
			jumpTargetX = -maskZone4X + window.innerWidth;
			break;
		case 10:
			jumpTargetX = -maskZone5On + 100;
			break;
		case 11:
			jumpTargetX = -maskZone5X + window.innerWidth;
			break;
		default:
			jumpTargetX = 0;
			break;
	}
	
	//var differenceSections = Math.abs( parseInt(sceneId) - parseInt(currentSceneId) );
	var differenceTargetX = Math.abs( Math.abs(targetX) - Math.abs(jumpTargetX) );
	//console.log(sceneId + "  = " + differenceTargetX);
	
	if (differenceTargetX < 5000 ) {
		animationBufferUpdate("slow");
		currentX = targetX = jumpTargetX;
	} else {
		transitionClose(sceneId, jumpTargetX);
	}
}

// PRELOADING ----------------------------

var loadedScenes = 0;
var totalScenes = 11;
var currentLoadGroup = [];
var loadGroups = [
	[0,1,2,3],
	[4,5,6,7],
	[8,9,10,11]
];
var loadGroupsCopy = loadGroups.slice();
var globaLoadlProgress = 0;
var localLoadProgress = 0;
var groupLoadProgress = 0;
var allowSilentLoading = true;

function preloadScenes(options){
	options = _.extend({
		loadGroup: [],
		loadtype: "section",
		silentLoad: false
	}, options);

	currentLoadGroup = options.loadGroup;

	// reset progress trackers
	loadedScenes = 0;
	groupLoadProgress = 0;

	page.trigger("loadStart", {
		type: options.loadType,
		silent: options.silentLoad
	});

	var  setupFunctions = _.map(options.loadGroup, function(id){
			return scenes[id].setup;
	});

	var starter = $.Deferred();

	var chain = _.reduce(setupFunctions, sequence, starter)
		.then(function(){
			page.trigger("loadComplete", {
				type: options.loadType,
				silent: allowSilentLoading
			});

			// FIXME: THIS BLOCK IS TEMPORARILY COMMENTED OUT TO TEST BUFFERING

			if(loadGroups.length){
				preloadScenes({
					loadGroup: loadGroups.shift(),
					loadType: "section",
					silentLoad: true
				});
			}
		})
		.always(function(){
			if (loadedScenes > setupFunctions.length) return;
			loadedScenes++;
		})
		.fail(function(err){
			console.error("Something went wrong setting up the scenes", err);
		});
	starter.resolve(options);

	return chain;
}

function sequence(p, c){
	return p.then(c);
}

function needsToBuffer(activeScene){
	var loadGroup = activeScene.loadGroup;
	var isLast = _.last(loadGroup) === activeScene.sceneId;

	// never buffer final scene
	if (_.last(scenes) === activeScene) return false;

	// only buffer when you're about to get to the first scene in the next loadGroup
	// currentSceneId gets updated after needstobuffer interrupts the animate routine, 
	// gotta wait for one more cycle
	if (!(isLast && currentSceneId !== activeScene.sceneId && currentScenePercentage < 0.99)) return false;

	// only buffer if entire nextLoadGroup is not complete
	var nextLoadGroup = scenes[activeScene.sceneId + 1].loadGroup;

	var groupIsLoaded = _.reduce(nextLoadGroup, function(isLoaded,sceneId){
		return isLoaded && scenes[sceneId].loaded;
	}, true);

	return !groupIsLoaded;
}

function solo(collection, soloist, propName){
	_.each(collection, function(player){
		if (player !== soloist) {
			player[propName] = false;
			return player;
		} else {
			player[propName] = true;
			return player;
		}
	});
	return collection;
}


// ASSET LOADING HELPERS ----------------------------

function loadFrameSequence(loader, root, numFrames, firstFrame){
	firstFrame = (firstFrame !== 0) ? firstFrame : 0;
	var frameNameArray = _.map(new Array(numFrames), function(u,i){
			return root + numberFormat(1+i, 2) + ".png";
		});
	var loadList = _.difference(frameNameArray, _.keys(PIXI.utils.TextureCache));
	loader.add(loadList);
	return frameNameArray;
}

function makeSpritesFromSheet(name, totalFrames, firstFrame, suffix){
	firstFrame = firstFrame || 0;
	suffix = suffix || "";
	return _.map(new Array(totalFrames), function(e,i){
		return name + "_" + (firstFrame + i) + suffix;
	}); 
}

function loadAssetList(loader, assetList){
	_.chain(assetList)
		.omit(_.keys(PIXI.utils.TextureCache))
		.each(function(url, name){
			loader.add(name, url);
		});

	return loader;
}

function reportLoadProgress(scene){
	var loadGroup = scene.loadGroup;
	var loaderProgress = scene.loader.progress * 0.01;

	var indexOfCurrentLoad = loadGroup.indexOf(scene.sceneId);

	groupLoadProgress =  (loaderProgress + indexOfCurrentLoad) / loadGroup.length;
	
	page.trigger("loadProgress", 
		{
			type: scene.loadType,
			progress: groupLoadProgress,
			loadIndex: indexOfCurrentLoad,
			id: scene.sceneId,
			silent: scene.silentLoad && allowSilentLoading,
			allow: allowSilentLoading
		}
	);
}

function modifyAssetURL(url){
	return imagePath + url;
}

function showThenHide(container){
	showGroup(container);
	// wait 2 frames to ensure that animate() runs at least once after the container is shown
	requestAnimationFrame(function(){
		requestAnimationFrame(function(){
			hideGroup(container);
		});
	});
	return container;
}

function makeSetupFunctions(){

	scenes[0].setup = function(options){
		var scene = scenes[0];
		
		console.log("LOADING SCENE ", scene.sceneId);

		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);

		var loader = scene.loader;

		// LOAD ASSETS --------------------------
		
		var assets = {
			"s0Bg"			: "/s0/background.jpg",
			"s0Sun"			: "/s0/redsun.png",
			"s0Water"		: "/s0/water.png",
			"s0Left"		: "/s0/left.png",
			"s0Right"		: "/s0/right.png",
			"s0Ship"		: "/s0/ship.png",
			"s0Airplane"	: "/s0/airplane.png",
			"s0City"		: "/s0/city.png",
			"s0CarShadow"	: "/s0/warmingoven/shadow.png",
			"s0Car"			: "/s0/warmingoven/DXP_DELIVERY_EXPERT_CAR_v001_48.png",
			"s0Swipe"		: "/s0/swipe.png",
			"s0Swipe2"		: "/s0/swipe2.png",
			"s0Logo"		: "/s0/logo_wide.png"
		};

		var fullPathAssets = {
			//"s0Logo"		: window.cdn + "assets/images_sized/1920/s0/logo.png",
			// "s0Logo"		: window.cdn + "assets/images_sized/1920/s0/logo_wide.png",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		_.extend(assets, fullPathAssets);

		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		scene.warmingOvenFrameNames = loadFrameSequence(loader, imagePath + "/s0/warmingoven_frames/", 15);

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(loader, resource){
			reportLoadProgress(scene);
			resource.on("loaded", function(){
				resource.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
				resource.texture.baseTexture.update();
			});
		});

		loader.load(onAssetsLoaded);
		
		function onAssetsLoaded() {
			showGroup(scene0Group);
			// EXTRA
			scene0Extra = new PIXI.Graphics();
			scene0Extra.beginFill(0xffffff);
			scene0Extra.drawRect(0, -9000, 4000, 10000);
			scene0Extra.endFill();
			scene0Group.addChild(scene0Extra);
			
			// BACKGROUND WALL
			scene0Bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s0Bg], 4000, 1080);
			scene0Bg.tileScale.x = scene0Bg.tileScale.y = assetScale;
			scene0Bg.position.x = 0;
			scene0Bg.position.y = 0;
			scene0Bg.tilePosition.x = 0;
			scene0Bg.tilePosition.y = 0;
			scene0Group.addChild(scene0Bg);

			// SUN
			scene0Sun = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Sun]);
			scene0Sun.scale.x = scene0Sun.scale.y = assetScale;
			scene0Sun.position.x = 180;
			scene0Sun.position.y = 680;
			scene0Group.addChild(scene0Sun);
			
			// WATER	
			scene0Water = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s0Water], 4000, 1080);
			scene0Water.tileScale.x = scene0Water.tileScale.y = assetScale;
			scene0Water.position.x = 0;
			scene0Water.position.y = 0;
			scene0Water.tilePosition.x = 0;
			scene0Water.tilePosition.y = 0;
			scene0Group.addChild(scene0Water);
			
			// COVER LEFT
			var contained = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Left]);
			contained.scale.x = contained.scale.y = assetScale;

			scene0CoverLeft = new PIXI.Container();
			scene0CoverLeft.addChild(contained);
			scene0CoverLeft.pivot.x = 0;
			scene0CoverLeft.pivot.y = 60;
			scene0CoverLeft.position.x = 0;
			scene0CoverLeft.position.y = 742;
			scene0Group.addChild(scene0CoverLeft);
			
			// COVER RIGHT
			contained = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Right]);
			contained.scale.x = contained.scale.y = assetScale;

			scene0CoverRight = new PIXI.Container();
			scene0CoverRight.addChild(contained);
			scene0CoverRight.pivot.x = 0;
			scene0CoverRight.pivot.y = 60;
			scene0CoverRight.position.x = 800;
			scene0CoverRight.position.y = 742;
			scene0Group.addChild(scene0CoverRight);
		
			// BOAT
			scene0Boat = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Ship]);
			scene0Boat.scale.x = scene0Boat.scale.y = assetScale;
			scene0Boat.position.x = 0;
			scene0Boat.position.y = 730;
			scene0Group.addChild(scene0Boat);
				// ADD ANIMATION
				scene0Timeline.fromTo( scene0Boat, 200, { x: windowFullWidthDifference }, { x: 0, repeat: -1, ease: Linear.easeNone }, 0);
			
			// AIRPLANE
			scene0Airplane = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Airplane]);
			scene0Airplane.scale.x = scene0Airplane.scale.y = assetScale;
			scene0Airplane.position.x = 0;
			scene0Airplane.position.y = 630;
			scene0Group.addChild(scene0Airplane);
				// ADD ANIMATION
				scene0Timeline.fromTo( scene0Airplane, 100, { x: 0 }, { x: windowFullWidthDifference, repeat: -1, ease: Linear.easeNone }, 0);
			
			// CITY	
			scene0City = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s0City], 4000, 1080);
			scene0City.tileScale.x = scene0City.tileScale.y = assetScale;
			scene0City.position.x = 0;
			scene0City.position.y = 0;
			scene0City.tilePosition.x = 0;
			scene0City.tilePosition.y = 0;
			scene0Group.addChild(scene0City);

			// CAR
			scene0Car = new PIXI.Container();
			scene0Car.pivot.x = 640;
			scene0Car.pivot.y = 640;
			scene0Car.position.x = minSiteWidth/2;
			scene0Car.position.y = 1010;
			scene0Group.addChild(scene0Car);
			
				// LOGO INSIDE CAR FOR EASE OF SCALING
				scene0Logo = new PIXI.Container();
				/*
				// OLD LOGO
				scene0Logo.pivot.x = 300;
				scene0Logo.pivot.y = 250;
				scene0Logo.position.x = 640;
				scene0Logo.position.y = 225;
				*/
				// NEW LOGO
				scene0Logo.scale.x = scene0Logo.scale.y = 0.85;
				scene0Logo.pivot.x = 500;
				scene0Logo.pivot.y = 180;
				scene0Logo.position.x = 640;
				scene0Logo.position.y = 185;
				
				scene0Car.addChild(scene0Logo);
					contained = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Logo]);
					contained.scale.x = contained.scale.y = assetScale;
					scene0Logo.addChild(contained);
			
				scene0CarShadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0CarShadow]);
				scene0CarShadow.scale.x = scene0CarShadow.scale.y = assetScale;
				scene0Car.addChild(scene0CarShadow);
				
				scene0CarBase = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Car]);
				scene0CarBase.scale.x = scene0CarBase.scale.y = assetScale;
				scene0Car.addChild(scene0CarBase);
			
				// ANIMATED WARMING OVEN
				var warmingOvenMovieClipArray = _.map(scene.warmingOvenFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				scene0CarOven = new PIXI.extras.MovieClip(warmingOvenMovieClipArray);
				scene0CarOven.scale.x = scene0CarOven.scale.y = assetScale;
				scene0CarOven.position.x = 728;
				scene0CarOven.position.y = 226;
				scene0CarOven.gotoAndStop(0);
				scene0Car.addChild(scene0CarOven);
				
			// SWIPE
			contained = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s0Swipe2]);
			contained.scale.x = contained.scale.y = assetScale;

			scene0Swipe = new PIXI.Container();
			scene0Swipe.addChild(contained);
			scene0Swipe.pivot.x = 260;
			scene0Swipe.pivot.y = 90;
			scene0Swipe.position.x = minSiteWidth/2;
			scene0Swipe.position.y = 1070;
			if ($html.hasClass("touch")) {
				scene0Swipe.scale.x = scene0Swipe.scale.y = 0.65;
				contained.texture = PIXI.utils.TextureCache[assets.s0Swipe];
			} else {
				scene0Swipe.scale.x = scene0Swipe.scale.y = 1;
				scene0Swipe.position.y = 1070;
			}
			scene0Group.addChild(scene0Swipe);
				// ADD ANIMATION
				scene0Timeline.fromTo( scene0Swipe, 2, { alpha: 1 }, { alpha: 0, repeat: -1, yoyo: true }, 0);

			// HACK TO MOVE THINGS DOWN BECAUSE OF THE MOBILE ADDRESS BAR
			if ($html.hasClass("touch")) {
				var extraPush = 40; 
				scene0Bg.position.y = scene0Bg.position.y + extraPush;
				scene0Water.position.y = scene0Water.position.y + extraPush;
				scene0CoverLeft.y = scene0CoverLeft.y + extraPush;
				scene0CoverRight.y = scene0CoverRight.y + extraPush;
				scene0City.position.y = scene0City.position.y + extraPush;
				scene0Boat.position.y = scene0Boat.position.y + extraPush;
				scene0Car.position.y = scene0Car.position.y + 20;
			}
			
			scene0Group.transitionalOverlay = transitionalOverlays[0];
			scene0Group.addChild(scene0Group.transitionalOverlay);

			scene0Loaded = true;
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene0Group);
		}

		return scene.loadDeferral;
	};

	scenes[1].setup = function(options){
		var scene = scenes[1];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);

		var loader = scene.loader;

		var assets = {
			"s1Sidewalk"		: "/s1/sidewalk.png",
			"s1Trees"			: "/s1/trees.png",
			"B747"          	: "/icons_finished/B747.json",
			"Piper"          	: "/icons_finished/Piper.json",
			//"Bird2"          	: "/icons_finished/Bird2.json",
			"Yacht"          	: "/icons_finished/Yacht.json",
			"Waving"          	: "/icons_finished/Waving.json",
			"Phone"          	: "/icons_finished/Phone.json",
			"Drinking_torso	"   : "/icons_finished/Drinking_torso.json",
			"Eating_torso"      : "/icons_finished/Eating_torso.json",
			"Phone_torso"       : "/icons_finished/Phone_torso.json",
			"Talking_torso"     : "/icons_finished/Talking_torso.json",

			"gDominos"			: "/s1/dominos.png",
			"gLand"				: "/s1/land.png",
			"gSkyDayExtra"		: "/sky_day-extended.jpg",
			"gSkyDay"			: "/sky_day.jpg",
			"gSunDay"			: "/sun_day.png",
			"gCloudsDay"		: "/clouds_day.png",
			"gCityDay"			: "/city_day.png",
			"gOceanDay"			: "/ocean_day.jpg",
			"gCarDay"			: "/car_day.png",
			"gCarShadow"		: "/car_shadow.png",
			"gWheelDay1"		: "/wheel1_day.png",
			"gWheelDay2"		: "/wheel2_day.png",
			"gStreetDay"		: "/street_day.jpg",
			"gGlowDay"			: "/glow_day.png",
			
			"gCoverupTree"	    : "/transitions/tree.png",
			"gCoverupBird"	    : "/transitions/bird.png",

			"wheels_day_f"		: "/icons_finished/wheels_day_f.json",
			"wheels_day_r"		: "/icons_finished/wheels_day_r.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		scene.carDayFrameNames = loadFrameSequence(loader, imagePath + "/car_day/", 66);

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(loader, resource){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			showGroup(scene1Group);
			/*
			var tempPositioningBar = new PIXI.Graphics();
			tempPositioningBar.beginFill(0x00FF00);
			tempPositioningBar.drawRect(0, 0, window.innerWidth, 50);
			tempPositioningBar.endFill();
			tempPositioningBar.scale.x = tempPositioningBar.scale.y = assetScale;
			tempPositioningBar.pivot.x = 0;
			tempPositioningBar.pivot.y = 50;
			tempPositioningBar.position.x = 0;
			tempPositioningBar.position.y = 1080;
			transitionGroup.addChild(tempPositioningBar);
			*/
			// TRANSTION TREE COVERUP
			transitionTree = new PIXI.Container();
			transitionTree.pivot.x = 300;
			transitionTree.pivot.y = 740;
			transitionTree.position.x = -300;
			transitionTree.position.y = 1080;
			transitionTree.visible = false;
			transitionTree.name = "transitionTree";
			coverupGroup.addChild(transitionTree);
				var tree = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCoverupTree]);
				tree.scale.x = tree.scale.y = assetScale;
				transitionTree.addChild(tree);

			// TRANSTION BIRD COVERUP
			transitionBird = new PIXI.Container();
			transitionBird.pivot.x = 240;
			transitionBird.pivot.y = 400;
			transitionBird.position.x = -300;
			transitionBird.position.y = 1080 - windowHalfHeight;
			transitionBird.visible = false;
			transitionBird.name = "transitionBird";
			coverupGroup.addChild(transitionBird);
				var bird = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCoverupBird]);
				bird.scale.x = bird.scale.y = assetScale;
				transitionBird.addChild(bird);
			
			// SKYLINE EXTRA
			scene1SkyExtra = new PIXI.Container();
			scene1Group.addChild(scene1SkyExtra);
				scene1SkyExtraDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDayExtra], scene1WidthContainer, 2000);
				scene1SkyExtraDay.tileScale.x = scene1SkyExtraDay.tileScale.y = assetScale;
				scene1SkyExtraDay.position.x = 0;
				scene1SkyExtraDay.position.y = -2000;
				scene1SkyExtraDay.tilePosition.x = 0;
				scene1SkyExtraDay.tilePosition.y = 0;
				scene1SkyExtra.addChild(scene1SkyExtraDay);
			
			// SKYLINE
			scene1Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDay], scene1WidthContainer, 476);
			scene1Sky.tileScale.x = scene1Sky.tileScale.y = assetScale;
			scene1Sky.position.x = 0;
			scene1Sky.position.y = 0;
			scene1Sky.tilePosition.x = 0;
			scene1Sky.tilePosition.y = 0;
			scene1Group.addChild(scene1Sky);
			
			// SUN
			scene1Sun = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSunDay]);
			scene1Sun.scale.x = scene1Sun.scale.y = assetScale;
			scene1Sun.position.x = 300;
			scene1Sun.position.y = 0;
			scene1Sun.pivot.x = scene1Sun.pivot.y = 150;
			scene1Group.addChild(scene1Sun);
			
			// CLOUDS
			scene1Clouds = new PIXI.Container();
			scene1Group.addChild(scene1Clouds);
			
				// SPRITE B747
				var spriteB747TextureArray = makeSpritesFromSheet("B747", 46);
				spriteB747 = new PIXI.extras.MovieClip.fromFrames(spriteB747TextureArray);
				spriteB747.scale.x = spriteB747.scale.y = assetScale;
				spriteB747.position.x = 500;
				spriteB747.position.y = 50;
				spriteB747.gotoAndStop(0);
				spriteB747.animationSpeed = 0.25;
				scene1Clouds.addChild(spriteB747);
					// ADD ANIMATION
					scene1Timeline.fromTo( spriteB747, 60, { x: cloudGroupBufferLeft }, { x: cloudGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
				
				// SPRITE Piper
				var spritePiperTextureArray = makeSpritesFromSheet("Piper", 46);
				spritePiper = new PIXI.extras.MovieClip.fromFrames(spritePiperTextureArray);
				spritePiper.scale.x = spritePiper.scale.y = assetScale;
				spritePiper.position.x = 500;
				spritePiper.position.y = 200;
				spritePiper.scale.x *= -1;
				spritePiper.gotoAndStop(0);
				spritePiper.animationSpeed = 0.25;
				scene1Clouds.addChild(spritePiper);
					// ADD ANIMATION
					scene1Timeline.fromTo( spritePiper, 40, { x: cloudGroupBufferRight }, { x: cloudGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);

				var clouds = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCloudsDay]);
				clouds.scale.x = clouds.scale.y = assetScale;
				clouds.position.x = 175;
				clouds.position.y = 205;
				scene1Clouds.addChild(clouds);
				
			// CITYSCAPE
			scene1City = new PIXI.Container();
			scene1Group.addChild(scene1City);
			
				var city = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityDay]);
				city.scale.x = city.scale.y = assetScale;
				city.position.x = -1500;
				city.position.y = 155;
				scene1City.addChild(city);
				
				var land = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gLand]);
				land.scale.x = land.scale.y = assetScale;
				land.position.x = 800;
				land.position.y = 341;
				scene1City.addChild(land);
				
			// OCEAN
			scene1Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanDay], scene1WidthContainer, 608);
			scene1Ocean.tileScale.x = scene1Ocean.tileScale.y = assetScale;
			scene1Ocean.position.x = 0;
			scene1Ocean.position.y = 472;
			scene1Group.addChild(scene1Ocean);
			
			// OCEAN OBJECTS
			scene1OceanObjects = new PIXI.Container();
			scene1Group.addChild(scene1OceanObjects);
				// SPRITE Yacht
				var spriteYachtTextureArray = makeSpritesFromSheet("Yacht", 19);
				spriteYacht = new PIXI.extras.MovieClip.fromFrames(spriteYachtTextureArray);
				spriteYacht.scale.x = spriteYacht.scale.y = assetScale;
				spriteYacht.position.x = 0;
				spriteYacht.position.y = 460;
				spriteYacht.gotoAndStop(0);
				spriteYacht.animationSpeed = 0.25;
				scene1OceanObjects.addChild(spriteYacht);
					// ADD ANIMATION
					scene1Timeline.fromTo( spriteYacht, 60, { x: oceanGroupBufferRight }, { x: oceanGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);

			// STREET OBJECTS
			scene1StreetObjects = new PIXI.Container();
			scene1StreetObjects.position.x = 2530;
			scene1StreetObjects.position.y = 730;
			scene1Group.addChild(scene1StreetObjects);
				var sidewalk = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s1Sidewalk]);
				sidewalk.scale.x = sidewalk.scale.y = assetScale;
				sidewalk.position.x = 2750;
				scene1StreetObjects.addChild(sidewalk);
				
			// STREET
			scene1Street = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetDay], scene1WidthContainer, 210);
			scene1Street.tileScale.x = scene1Street.tileScale.y = assetScale;
			scene1Street.position.x = 0;
			scene1Street.position.y = 870;
			scene1Street.tilePosition.x = 0;
			scene1Street.tilePosition.y = 0;
			scene1Group.addChild(scene1Street);
			
			// DOMINOS
			scene1Dominos = new PIXI.Container();
			scene1Dominos.position.x = 2000;
			scene1Dominos.position.y = 325;
			scene1Group.addChild(scene1Dominos);
				var dominos = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gDominos]);
				dominos.scale.x = dominos.scale.y = assetScale;
				dominos.position.x = 500;
				scene1Dominos.addChild(dominos);
				
				// SPRITE Phone
				var spritePhoneTextureArray = makeSpritesFromSheet("Phone", 44);
				spritePhone = new PIXI.extras.MovieClip.fromFrames(spritePhoneTextureArray);
				spritePhone.scale.x = spritePhone.scale.y = assetScale;
				spritePhone.position.x = 3050;
				spritePhone.position.y = 425;
				spritePhone.gotoAndStop(0);
				spritePhone.animationSpeed = 0.25;
				scene1Dominos.addChild(spritePhone);
				
				// SPRITE Waving
				var spriteWavingTextureArray = makeSpritesFromSheet("Waving", 48);
				spriteWaving = new PIXI.extras.MovieClip.fromFrames(spriteWavingTextureArray);
				spriteWaving.scale.x = spriteWaving.scale.y = assetScale;
				spriteWaving.position.x = 300;
				spriteWaving.position.y = 425;
				spriteWaving.gotoAndStop(0);
				spriteWaving.animationSpeed = 0.25;
				scene1Dominos.addChild(spriteWaving);
				
				// SPRITE Drinking_torso
				var spriteDrinking_torsoTextureArray = makeSpritesFromSheet("Drinking_torso", 38);
				spriteDrinking_torso = new PIXI.extras.MovieClip.fromFrames(spriteDrinking_torsoTextureArray);
				spriteDrinking_torso.scale.x = spriteDrinking_torso.scale.y = assetScale;
				spriteDrinking_torso.position.x = 715;
				spriteDrinking_torso.position.y = 426;
				spriteDrinking_torso.gotoAndStop(0);
				spriteDrinking_torso.animationSpeed = 0.25;
				spriteDrinking_torso.alpha = .5;
				scene1Dominos.addChild(spriteDrinking_torso);
				
				// SPRITE Eating_torso
				var spriteEating_torsoTextureArray = makeSpritesFromSheet("Eating_torso", 34);
				spriteEating_torso = new PIXI.extras.MovieClip.fromFrames(spriteEating_torsoTextureArray);
				spriteEating_torso.scale.x = spriteEating_torso.scale.y = assetScale;
				spriteEating_torso.position.x = 920;
				spriteEating_torso.position.y = 426;
				spriteEating_torso.scale.x *= -1;
				spriteEating_torso.gotoAndStop(0);
				spriteEating_torso.animationSpeed = 0.25;
				spriteEating_torso.alpha = .5;
				scene1Dominos.addChild(spriteEating_torso);
				
				// SPRITE Phone_torso
				var spritePhone_torsoTextureArray = makeSpritesFromSheet("Phone_torso", 44);
				spritePhone_torso = new PIXI.extras.MovieClip.fromFrames(spritePhone_torsoTextureArray);
				spritePhone_torso.scale.x = spritePhone_torso.scale.y = assetScale;
				spritePhone_torso.position.x = 2370;
				spritePhone_torso.position.y = 515;
				spritePhone_torso.gotoAndStop(0);
				spritePhone_torso.animationSpeed = 0.25;
				spritePhone_torso.alpha = .5;
				scene1Dominos.addChild(spritePhone_torso);
				
				// SPRITE Talking_torso
				var spriteTalking_torsoTextureArray = makeSpritesFromSheet("Talking_torso", 46);
				spriteTalking_torso = new PIXI.extras.MovieClip.fromFrames(spriteTalking_torsoTextureArray);
				spriteTalking_torso.scale.x = spriteTalking_torso.scale.y = assetScale;
				spriteTalking_torso.position.x = 2360;
				spriteTalking_torso.position.y = 515;
				spriteTalking_torso.scale.x *= -1;
				spriteTalking_torso.gotoAndStop(0);
				spriteTalking_torso.animationSpeed = 0.25;
				spriteTalking_torso.alpha = .5;
				scene1Dominos.addChild(spriteTalking_torso);
				/*
				// SPRITE Bird2
				var spriteBird2TextureArray = makeSpritesFromSheet("Bird2", 9);
				spriteBird2 = new PIXI.extras.MovieClip.fromFrames(spriteBird2TextureArray);
				spriteBird2.scale.x = spriteBird2.scale.y = assetScale;
				spriteBird2.position.x = 3000;
				spriteBird2.position.y = 200;
				spriteBird2.gotoAndStop(0);
				spriteBird2.animationSpeed = 0.5;
				scene1Dominos.addChild(spriteBird2);
				*/
				
			// ANIMATED CAR
			var spriteArray;
			var car = scene.car = new PIXI.Container();

				car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
					car.shadow.scale.x = car.shadow.scale.y = assetScale;
					car.shadow.position.x = -120;
					car.shadow.position.y = 310;
				car.addChild(car.shadow);

				//car textures
				var carMovieClipArray = _.map(scene.carDayFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				
				var carBaseTexture = carMovieClipArray.shift();
				var carBase = new PIXI.Sprite(carBaseTexture);
					carBase.scale.x = carBase.scale.y = assetScale;
				car.addChild(carBase);

				car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
					car.reflections.scale.x = car.reflections.scale.y = assetScale;
				car.addChild(car.reflections);

				car.wheels = new PIXI.Container();

					spriteArray = makeSpritesFromSheet("wheels_day_f", 99);
					car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
						car.wheels.front.position.x = 66;
						car.wheels.front.position.y = 234;
					car.wheels.addChild(car.wheels.front);

					spriteArray = makeSpritesFromSheet("wheels_day_r", 99);
					car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
						car.wheels.rear.position.x = 520;
						car.wheels.rear.position.y = 234;
					car.wheels.addChild(car.wheels.rear);

				car.addChild(car.wheels);

				car.pivot.x = 345;
				car.pivot.y = 430;
				car.position.x = minSiteWidth/2;
				car.position.y = 1080;

				scene1Group.addChild(car);

			// SUN GLOW
			scene1Glow = new PIXI.Container();
			scene1Glow.position.x = 300;
			scene1Glow.position.y = 0;
			scene1Glow.pivot.x = scene1Glow.pivot.y = 250;
			scene1Glow.scale.x = 5;
			scene1Glow.scale.y = 5;
			scene1Group.addChild(scene1Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowDay]);
				glow.scale.x = glow.scale.y = assetScale;
				scene1Glow.addChild(glow);
				
			// TREES
			scene1Trees = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s1Trees], scene1WidthContainer, 1080);
			scene1Trees.tileScale.x = scene1Trees.tileScale.y = assetScale;
			scene1Trees.position.x = 0;
			scene1Trees.position.y = 0;
			scene1Trees.tilePosition.x = 0;
			scene1Trees.tilePosition.y = 0;
			scene1Group.addChild(scene1Trees);

			scene1Group.transitionalOverlay = transitionalOverlays[1];
			scene1Group.addChild(scene1Group.transitionalOverlay);
				
			scene1Loaded = true;
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);

			sceneArray.push(scene1Group);
		}

		return scene.loadDeferral;
	};

	scenes[2].setup = function(options){
		var scene = scenes[2];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		var loader = scene.loader;

		// LOAD ASSETS --------------------------
		
		var assets = {
			"s2Bg"		: "/s2/background.jpg",
			"s2Car"		: "/s2/car.png",

			"gGlowDay"	: "/glow_day.png",
		};

		
		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);
		/*
		if ($html.hasClass("touch")) {
			// LOAD NOTHING
		} else {
			var ovenTextureFrames = 48;
			var ovenTextureArray = [];
			for (var i=0; i < ovenTextureFrames; i++) {
				var texture = imagePath + "/s2/warmingoven/DXP_GH_OvenDoorALT_HHD_Base_000" + numberFormat(i+1, 2) + ".png";
				//  ONLY LOADS 1/4 OF THE IMAGES
				if (i % 4 === 0) {
					ovenTextureArray.push(texture);
				}
			};
			loadAssetList(loader, ovenTextureArray);
		}
		*/
		// LOAD SEQUENCES --------------------------

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			// BACKGROUND
			scene2Bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s2Bg], 3000, 1080);
			scene2Bg.tileScale.x = scene2Bg.tileScale.y = assetScale;
			scene2Bg.tilePosition.x = 0;
			scene2Bg.tilePosition.y = 0;
			scene2Bg.pivot.x = 0;
			scene2Bg.pivot.y = 1080;
			scene2Bg.position.x = 0;
			scene2Bg.position.y = 1080;
			scene2Group.addChild(scene2Bg);
			
			// NORMAL CAR
			scene2Car = new PIXI.Container();
			scene2Car.position.x = minSiteWidth/2;
			scene2Car.position.y = 1080;
			scene2Car.pivot.x = 1550;
			scene2Car.pivot.y = 930;
			scene2Car.scale.x = scene2Car.scale.y = 0.9;
			if ($html.hasClass("touch")) scene2Car.scale.x = scene2Car.scale.y = 0.75;
			scene2Group.addChild(scene2Car);
				var car = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s2Car]);
				car.scale.x = car.scale.y = assetScale;
				scene2Car.addChild(car);
					
			/*
			if ($html.hasClass("touch")) {
				// NORMAL CAR
				scene2Car = new PIXI.Container();
				scene2Car.position.x = minSiteWidth/2;
				scene2Car.position.y = 1080;
				scene2Car.pivot.x = 1550;
				scene2Car.pivot.y = 930;
				scene2Car.scale.x = scene2Car.scale.y = 0.9;
				if ($html.hasClass("touch")) scene2Car.scale.x = scene2Car.scale.y = 0.5;
				scene2Group.addChild(scene2Car);
					var car = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s2Car]);
					car.scale.x = car.scale.y = assetScale;
					scene2Car.addChild(car);
			} else {
				// ANIMATED CAR
				for (var i=0; i < ovenTextureArray.length; i++) {
					var texture = PIXI.Texture.fromFrame(ovenTextureArray[i]);
					ovenMovieClipArray.push(texture);
				};
				
				scene2Car = new PIXI.Container();
				scene2Car.position.x = minSiteWidth/2;
				scene2Car.position.y = 1080;
				scene2Car.pivot.x = 1550;
				scene2Car.pivot.y = 930;
				scene2Car.scale.x = scene2Car.scale.y = 0.9;
				if ($html.hasClass("touch")) scene2Car.scale.x = scene2Car.scale.y = 0.5;
				scene2Group.addChild(scene2Car);
					scene2WarmingOven = new PIXI.extras.MovieClip(ovenMovieClipArray);
					scene2WarmingOven.scale.x = scene2WarmingOven.scale.y = assetScale;
					scene2WarmingOven.gotoAndStop(0);
					scene2WarmingOven.animationSpeed = .5;
					scene2WarmingOven.loop = false;
					scene2Car.addChild(scene2WarmingOven);
			}
			*/
			// SUN GLOW
			scene2Glow = new PIXI.Container();
			scene2Glow.position.x = 300;
			scene2Glow.position.y = 0;
			scene2Glow.pivot.x = scene2Glow.pivot.y = 250;
			scene2Glow.scale.x = 5;
			scene2Glow.scale.y = 5;
			scene2Glow.alpha = 0.5;
			scene2Group.addChild(scene2Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowDay]);
				glow.scale.x = glow.scale.y = assetScale;
				scene2Glow.addChild(glow);

			scene2Group.transitionalOverlay = transitionalOverlays[2];
			scene2Group.addChild(scene2Group.transitionalOverlay);
		
			scene2Loaded = true;
			
			//showGroup(scene2Group);
			//TweenMax.delayedCall(1, hideGroup, [scene2Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			// scene2Group.hideChildren(true);
			//showThenHide(scene2Group);
			
			sceneArray.push(scene2Group);
		}

		return scene.loadDeferral;
	};

	scenes[3].setup = function(options){
		var scene = scenes[3];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		var loader = scene.loader;

		// LOAD ASSETS --------------------------

		var assets = {		
			"s3Trees"		: "/s3/trees.png",
			"s3Fencing"		: "/fencing_day.png",
			"Ship"			: "/icons_finished/Ship.json",
			"Sailboat"		: "/icons_finished/Sailboat.json",
			"B777"			: "/icons_finished/B777.json",
			"Jogger"        : "/icons_finished/Jogger.json",
			"Walking_waving"          	: "/icons_finished/Walking_waving.json",

			"gSkyDayExtra"	: "/sky_day-extended.jpg",
			"gSkyDay"		: "/sky_day.jpg",
			"gLand"			: "/s1/land.png",
			"gSunDay"		: "/sun_day.png",
			"gCloudsDay"	: "/clouds_day.png",
			"gCityDay"		: "/city_day.png",
			"gOceanDay"		: "/ocean_day.jpg",
			"gCarShadow"	: "/car_shadow.png",
			"gBuildingsDay"	: "/buildings_day.png",
			"gCarDay"		: "/car_day.png",
			"gStreetDay"	: "/street_day.jpg",
			"gWheelDay1"	: "/wheel1_day.png",
			"gWheelDay2"	: "/wheel2_day.png",
			"gGlowDay"		: "/glow_day.png",

			"wheels_day_f"		: "/icons_finished/wheels_day_f.json",
			"wheels_day_r"		: "/icons_finished/wheels_day_r.json",
		};

		
		assets = _.mapObject(assets, modifyAssetURL);
	
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		scene.carDayFrameNames = loadFrameSequence(loader, imagePath + "/car_day/", 66);
		
		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			// SKYLINE EXTRA
			scene3SkyExtra = new PIXI.Container();
			scene3Group.addChild(scene3SkyExtra);
				scene3SkyExtraDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDayExtra], scene3WidthContainer, 2000);
				scene3SkyExtraDay.tileScale.x = scene3SkyExtraDay.tileScale.y = assetScale;
				scene3SkyExtraDay.position.x = 0;
				scene3SkyExtraDay.position.y = -2000;
				scene3SkyExtraDay.tilePosition.x = 0;
				scene3SkyExtraDay.tilePosition.y = 0;
				scene3SkyExtra.addChild(scene3SkyExtraDay);
				
			// SKYLINE
			scene3Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDay], scene3WidthContainer, 476);
			scene3Sky.tileScale.x = scene3Sky.tileScale.y = assetScale;
			scene3Sky.tilePosition.x = 0;
			scene3Sky.tilePosition.y = 0;
			scene3Sky.position.x = 0;
			scene3Sky.position.y = 0;

			scene3Group.addChild(scene3SkyExtra);
			scene3Group.addChild(scene3Sky);
			
			// SUN
			scene3Sun = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSunDay]);
			scene3Sun.scale.x = scene3Sun.scale.y = assetScale;
			scene3Sun.position.x = 300;
			scene3Sun.position.y = 0;
			scene3Sun.pivot.x = scene3Sun.pivot.y = 150;
			scene3Group.addChild(scene3Sun);
			
			// CLOUDS
			scene3Clouds = new PIXI.Container();
			scene3Group.addChild(scene3Clouds);
				var clouds = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCloudsDay]);
				clouds.scale.x = clouds.scale.y = assetScale;
				clouds.position.x = 800;
				clouds.position.y = 205;
				scene3Clouds.addChild(clouds);
				
				//SPRITE B777
				var spriteB777TextureArray = makeSpritesFromSheet("B777", 46);
				spriteB777 = new PIXI.extras.MovieClip.fromFrames(spriteB777TextureArray);
				spriteB777.scale.x = spriteB777.scale.y = assetScale;
				spriteB777.position.x = 500;
				spriteB777.position.y = 50;
				spriteB777.gotoAndStop(0);
				spriteB777.animationSpeed = 0.25;
				scene3Clouds.addChild(spriteB777);
					// ADD ANIMATION
					scene3Timeline.fromTo( spriteB777, 60, { x: cloudGroupBufferLeft }, { x: cloudGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
			

			// CITYSCAPE
			scene3City = new PIXI.Container();
			scene3Group.addChild(scene3City);
				var city = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityDay]);
				city.scale.x = city.scale.y = assetScale;
				city.position.x = -750;
				city.position.y = 155;
				scene3City.addChild(city);

				var land = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gLand]);
				land.scale.x = land.scale.y = assetScale;
				land.position.x = 1550;
				land.position.y = 341;
				scene3City.addChild(land);
			
			// OCEAN
			scene3Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanDay], scene3WidthContainer, 608);
			scene3Ocean.tileScale.x = scene3Ocean.tileScale.y = assetScale;
			scene3Ocean.position.x = 0;
			scene3Ocean.position.y = 472;
			scene3Group.addChild(scene3Ocean);
			
			// OCEAN OBJECTS
			scene3OceanObjects = new PIXI.Container();
			scene3Group.addChild(scene3OceanObjects);
			
				// SPRITE SHIP
				var spriteShipTextureArray = makeSpritesFromSheet("Ship", 28);
				spriteShip = new PIXI.extras.MovieClip.fromFrames(spriteShipTextureArray);
				spriteShip.scale.x = spriteShip.scale.y = assetScale;
				spriteShip.position.x = 3000;
				spriteShip.position.y = 460;
				spriteShip.scale.x *= -1;
				spriteShip.gotoAndStop(0);
				spriteShip.animationSpeed = 0.25;
				scene3OceanObjects.addChild(spriteShip);
					// ADD ANIMATION
					scene3Timeline.fromTo( spriteShip, 60, { x: oceanGroupBufferRight }, { x: oceanGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);

				// SPRITE SAILBOAT
				var spriteSailboatTextureArray = makeSpritesFromSheet("Sailboat", 38);
				spriteSailboat = new PIXI.extras.MovieClip.fromFrames(spriteSailboatTextureArray);
				spriteSailboat.scale.x = spriteSailboat.scale.y = assetScale;
				spriteSailboat.position.x = 1500;
				spriteSailboat.position.y = 440;
				spriteSailboat.gotoAndStop(0);
				spriteSailboat.animationSpeed = 0.25;
				scene3OceanObjects.addChild(spriteSailboat);
					// ADD ANIMATION
					scene3Timeline.fromTo( spriteSailboat, 100, { x: oceanGroupBufferLeft }, { x: oceanGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
			
				
			// STREET
			scene3Street = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetDay], scene3WidthContainer, 210);
			scene3Street.tileScale.x = scene3Street.tileScale.y = assetScale;
			scene3Street.tilePosition.x = 0;
			scene3Street.tilePosition.y = 0;
			scene3Street.position.x = 0;
			scene3Street.position.y = 870;
			scene3Group.addChild(scene3Street);
			
			// BUILDINGS
			scene3Buildings = new PIXI.Container();
			scene3Group.addChild(scene3Buildings);

				var fence = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s3Fencing]);
				fence.scale.x = fence.scale.y = assetScale;
				fence.position.x = 1240;
				fence.position.y = 665;
				scene3Buildings.addChild(fence);

				var buildings = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gBuildingsDay]);
				buildings.scale.x = buildings.scale.y = assetScale;
				buildings.position.x = -1200;
				buildings.position.y = 505;
				scene3Buildings.addChild(buildings);
				
				// SPRITE Jogger
				var spriteJoggerTextureArray = makeSpritesFromSheet("Jogger", 9);
				spriteJogger = new PIXI.extras.MovieClip.fromFrames(spriteJoggerTextureArray);
				spriteJogger.scale.x = spriteJogger.scale.y = assetScale;
				spriteJogger.position.x = 0;
				spriteJogger.position.y = 786;
				spriteJogger.gotoAndStop(0);
				spriteJogger.animationSpeed = 0.25;
				scene3Buildings.addChild(spriteJogger);
					// ADD ANIMATION
					scene3Timeline.fromTo( spriteJogger, 40, { x: buildingGroupBufferRight }, { x: buildingGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);
					
				// SPRITE Walking_waving
				var spriteWalking_wavingTextureArray = makeSpritesFromSheet("Walking_waving", 40);
				spriteWalking_waving = new PIXI.extras.MovieClip.fromFrames(spriteWalking_wavingTextureArray);
				spriteWalking_waving.scale.x = spriteWalking_waving.scale.y = assetScale;
				spriteWalking_waving.scale.x *= -1;
				spriteWalking_waving.position.x = 0;
				spriteWalking_waving.position.y = 750;
				spriteWalking_waving.gotoAndStop(0);
				spriteWalking_waving.animationSpeed = 0.25;
				scene3Buildings.addChild(spriteWalking_waving);
					// ADD ANIMATION
					scene3Timeline.fromTo( spriteWalking_waving, 80, { x: buildingGroupBufferLeft }, { x: buildingGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
					
			// ANIMATED CAR
			var spriteArray;
			var car = scene.car = new PIXI.Container();

				car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
					car.shadow.scale.x = car.shadow.scale.y = assetScale;
					car.shadow.position.x = -120;
					car.shadow.position.y = 310;
				car.addChild(car.shadow);

				//car textures
				var carMovieClipArray = _.map(scene.carDayFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				
				var carBaseTexture = carMovieClipArray.shift();
				var carBase = new PIXI.Sprite(carBaseTexture);
					carBase.scale.x = carBase.scale.y = assetScale;
				car.addChild(carBase);

				car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
					car.reflections.scale.x = car.reflections.scale.y = assetScale;
				car.addChild(car.reflections);

				car.wheels = new PIXI.Container();
					spriteArray = makeSpritesFromSheet("wheels_day_f", 99);
					car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
						car.wheels.front.position.x = 66;
						car.wheels.front.position.y = 234;
					car.wheels.addChild(car.wheels.front);

					spriteArray = makeSpritesFromSheet("wheels_day_r", 99);
					car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
						car.wheels.rear.position.x = 520;
						car.wheels.rear.position.y = 234;
					car.wheels.addChild(car.wheels.rear);
				car.addChild(car.wheels);

				car.pivot.x = 345;
				car.pivot.y = 430;
				car.position.x = minSiteWidth/2;
				car.position.y = 1080;

			scene3Group.addChild(car);
				
			// SUN GLOW
			scene3Glow = new PIXI.Container();
			scene3Glow.position.x = 300;
			scene3Glow.position.y = 0;
			scene3Glow.pivot.x = scene3Glow.pivot.y = 250;
			scene3Glow.scale.x = 5;
			scene3Glow.scale.y = 5;
			scene3Group.addChild(scene3Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowDay]);
				glow.scale.x = glow.scale.y = assetScale;
				scene3Glow.addChild(glow);
			
			// TREES
			scene3Trees = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s3Trees], scene3WidthContainer, 1080);
			scene3Trees.tileScale.x = scene3Trees.tileScale.y = assetScale;
			scene3Trees.tilePosition.x = 0;
			scene3Trees.tilePosition.y = 0;
			scene3Trees.position.x = 0;
			scene3Trees.position.y = 0;
			scene3Group.addChild(scene3Trees);

			scene3Group.transitionalOverlay = transitionalOverlays[3];
			scene3Group.addChild(scene3Group.transitionalOverlay);
				/*
				// TESTING WIDTH OF CONTAINERS AND HOW WIDE THEY GO WHEN SCROLLING
				var tempPositioningBar = new PIXI.Graphics(); // 3000
				tempPositioningBar.beginFill(0x003366);
				tempPositioningBar.drawRect(0, 0, 2900, 5);
				tempPositioningBar.endFill();
				scene3Clouds.addChild(tempPositioningBar);
			
				var tempPositioningBar = new PIXI.Graphics();	// 3500
				tempPositioningBar.beginFill(0xFF0000);
				tempPositioningBar.drawRect(0, 50, 3400, 5);
				tempPositioningBar.endFill();
				scene3OceanObjects.addChild(tempPositioningBar);
			
				var tempPositioningBar = new PIXI.Graphics();	// 4000	
				tempPositioningBar.beginFill(0x00FF00);
				tempPositioningBar.drawRect(0, 100, 4000, 5);
				tempPositioningBar.endFill();
				scene3Buildings.addChild(tempPositioningBar);
				*/
			scene3Loaded = true;
			
			//showGroup(scene3Group);
			//TweenMax.delayedCall(1, hideGroup, [scene3Group]);
			
			scene.loading = false;
			scene.loaded = true;
			
			scene.loadDeferral.resolve(options);
			
			// scene3Group.hideChildren(true);
			// showThenHide(scene3Group);
			
			sceneArray.push(scene3Group);
		}

		return scene.loadDeferral;
	};

	scenes[4].setup = function(options){
		var scene = scenes[4];

		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		// LOAD ASSETS --------------------------

		var assets = {
			"s4SidewalkTop"		: "/s4/sidewalk_top.jpg",
			"s4SidewalkBottom"	: "/s4/sidewalk_bottom.jpg",
			"s4Car_body"		: "/s4/car.png",
			"s4Car_bag1"		: "/s4/bag1.png",
			"s4Car_bag2"		: "/s4/bag2.png",
			"s4Car_flashlight"	: "/s4/flashlight.png",
			"s4Car_napkins"		: "/s4/napkins.png",
			"s4Car_sauce2"		: "/s4/sauce2.png",
			"s4Car_soda"		: "/s4/soda.png",
			"s4Car_windshield"	: "/s4/windshield.png",
			"Top_bird"          : "/icons_finished/Top_bird.json",

			"gRoadBgExtra"		: "/s4/extra.jpg",
			"gRoadBg"			: "/s4/background.jpg",
			"gGlowDay"			: "/glow_day.png",
			
			"gCoverupBird"	: "/transitions/bird.png",
		};
		
		
		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			// EXTRA
			scene4Extra = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gRoadBgExtra], 4000, 6000);
			scene4Extra.tileScale.x = scene4Extra.tileScale.y = assetScale;
			scene4Extra.tilePosition.x = 0;
			scene4Extra.tilePosition.y = 0;
			scene4Extra.pivot.x = 0;
			scene4Extra.pivot.y = 3000;
			scene4Extra.position.x = 0;
			scene4Extra.position.y = 0;
			scene4Group.addChild(scene4Extra);

			// BACKGROUND
			scene4Bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gRoadBg], 4000, 1080);
			scene4Bg.tileScale.x = scene4Bg.tileScale.y = assetScale;
			scene4Bg.tilePosition.x = 0;
			scene4Bg.tilePosition.y = 0;
			scene4Bg.position.x = 0;
			scene4Bg.position.y = 0;
			scene4Bg.scale.x *= assetScale;
			scene4Bg.scale.y *= assetScale;
			scene4Group.addChild(scene4Bg);

			// SIDEWALK TOP
			scene4SidewalkTop = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s4SidewalkTop], 4000, 180);
			scene4SidewalkTop.tileScale.x = scene4SidewalkTop.tileScale.y = assetScale;
			scene4SidewalkTop.position.x = 0;
			scene4SidewalkTop.position.y = 0;
			scene4SidewalkTop.tilePosition.x = 0;
			scene4SidewalkTop.tilePosition.y = 0;
			scene4Group.addChild(scene4SidewalkTop);

			// SIDEWALK BOTTOM
			scene4SidewalkBottom = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s4SidewalkBottom], 4000, 180);
			scene4SidewalkBottom.tileScale.x = scene4SidewalkBottom.tileScale.y = assetScale;
			scene4SidewalkBottom.tilePosition.x = 0;
			scene4SidewalkBottom.tilePosition.y = 0;
			scene4SidewalkBottom.position.x = 0;
			scene4SidewalkBottom.position.y = 0;
			scene4SidewalkBottom.pivot.x = 0;
			scene4SidewalkBottom.pivot.y = 180;
			scene4Group.addChild(scene4SidewalkBottom);
			scene4SidewalkBottom.visible = false;

			// CAR
			scene4Car = new PIXI.Container();
			scene4Car.position.x = minSiteWidth/2;
			scene4Car.position.y = 540; 
			scene4Car.pivot.x = 500;
			scene4Car.pivot.y = 300;
			scene4Car.scale.x = 0.75;
			scene4Car.scale.y = 0.75;
			scene4Group.addChild(scene4Car);
				scene4CarBody = new PIXI.Container();
				scene4CarBody.position.x = 0;
				scene4CarBody.position.y = 0;
				scene4Car.addChild(scene4CarBody);
					var carBody = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_body]); 
					carBody.scaleX = carBody.scaleY = assetScale;
					scene4CarBody.addChild(carBody);
				
				scene4CarFlashlight = new PIXI.Container();
				scene4CarFlashlight.position.x = 529;
				scene4CarFlashlight.position.y = 184;
				scene4CarFlashlight.scale.x = scene4CarFlashlight.scale.y = 0.65;
				scene4Car.addChild(scene4CarFlashlight);
					var flashlight = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_flashlight]);
					flashlight.scaleX = flashlight.scaleY = assetScale;
					scene4CarFlashlight.addChild(flashlight);

				scene4CarSauce2 = new PIXI.Container();
				scene4CarSauce2.position.x = 523;
				scene4CarSauce2.position.y = 241;
				scene4CarSauce2.scale.x = scene4CarSauce2.scale.y = 0.65;
				scene4Car.addChild(scene4CarSauce2);
					var sauce = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_sauce2]);
					sauce.scale.x = sauce.scale.y = assetScale;
					scene4CarSauce2.addChild(sauce);
				
				scene4CarSoda = new PIXI.Container();
				scene4CarSoda.position.x = 583;
				scene4CarSoda.position.y = 196;
				scene4CarSoda.scale.x = scene4CarSoda.scale.y = 0.65;
				scene4Car.addChild(scene4CarSoda);
					var soda = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_soda]);
					soda.scale.x = soda.scale.y = assetScale;
					scene4CarSoda.addChild(soda);
				
				scene4CarNapkins = new PIXI.Container();
				scene4CarNapkins.position.x = 523;
				scene4CarNapkins.position.y = 191;
				scene4CarNapkins.scale.x = scene4CarNapkins.scale.y = 0.65;
				scene4Car.addChild(scene4CarNapkins);
					var napkins = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_napkins]);
					napkins.scaleX = napkins.scaleY = assetScale;
					scene4CarNapkins.addChild(napkins);

				scene4CarBag1 = new PIXI.Container();
				scene4CarBag1.position.x = 420;
				scene4CarBag1.position.y = 155;
				scene4CarBag1.scale.x = scene4CarBag1.scale.y = 0.65;
				scene4Car.addChild(scene4CarBag1);
					var bag1 = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_bag1]);
					bag1.scale.x = bag1.scale.y = assetScale;
					scene4CarBag1.addChild(bag1);
				
				scene4CarBag2 = new PIXI.Container();
				scene4CarBag2.position.x = 766;
				scene4CarBag2.position.y = 178;
				scene4CarBag2.scale.x = scene4CarBag2.scale.y = 0.65;
				scene4Car.addChild(scene4CarBag2);
					var bag2 = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_bag2]);
					bag2.scale.x = bag2.scale.y = assetScale;
					scene4CarBag2.addChild(bag2);
				
				scene4CarWindshield = new PIXI.Container();
				scene4CarWindshield.position.x = 0;
				scene4CarWindshield.position.y = 0;
				scene4Car.addChild(scene4CarWindshield);
					var windshield = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s4Car_windshield]);
					windshield.scale.x = windshield.scale.y = assetScale;
					scene4CarWindshield.addChild(windshield);

			// SPRITE Top_bird
			var spriteTop_birdTextureArray = makeSpritesFromSheet("Top_bird", 11);
			spriteTop_bird = new PIXI.extras.MovieClip.fromFrames(spriteTop_birdTextureArray);
			spriteTop_bird.scale.x = spriteTop_bird.scale.y = assetScale;
			spriteTop_bird.position.x = 0;
			spriteTop_bird.position.y = 50;
			spriteTop_bird.gotoAndStop(0);
			spriteTop_bird.animationSpeed = 0.5;
			scene4Group.addChild(spriteTop_bird);
				// ADD ANIMATION
				scene4BirdTimeline.fromTo( spriteTop_bird, 1, { alpha: 0 }, { alpha: 1, ease: Linear.easeNone }, 0);
				scene4BirdTimeline.fromTo( spriteTop_bird, 5, { x: windowFullWidthDifference, y: 50 }, { x: -300, y: 50, ease: Linear.easeNone }, 0);
				scene4BirdTimeline.fromTo( spriteTop_bird, 1, { alpha: 0 }, { alpha: 1, ease: Linear.easeNone }, 5);
				scene4BirdTimeline.fromTo( spriteTop_bird, 5, { x: windowFullWidthDifference, y: 550 }, { x: -300, y: 550, ease: Linear.easeNone }, 5);

			// SUN GLOW
			scene4Glow = new PIXI.Container();
			scene4Glow.position.x = 300;
			scene4Glow.position.y = 0;
			scene4Glow.pivot.x = scene4Glow.pivot.y = 250;
			scene4Glow.scale.x = 5;
			scene4Glow.scale.y = 5;
			scene4Glow.alpha = 0.5
			scene4Group.addChild(scene4Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowDay]);
				glow.scale.x = glow.scale.y = assetScale;
				scene4Glow.addChild(glow);

			scene4Group.transitionalOverlay = transitionalOverlays[4];
			scene4Group.addChild(scene4Group.transitionalOverlay);
		
			// SCENE 4 ANIMATION
			scene4Timeline.to( scene4CarBag1, 1, { x: 462, y: 513, scaleX: 1, scaleY: 1, ease: Expo.easeInOut }, 0);
			scene4Timeline.to( scene4CarBag2, 1, { x: 785, y: -60, scaleX: 1, scaleY: 1, ease: Expo.easeInOut }, 0.1);
			scene4Timeline.to( scene4CarNapkins, 1, { x: 740, y: 515, scaleX: 1, scaleY: 1, ease: Expo.easeInOut }, 0.2);
			scene4Timeline.to( scene4CarSauce2, 1, { x: 660, y: 517, scaleX: 1, scaleY: 1, ease: Expo.easeInOut }, 0.5);
			scene4Timeline.to( scene4CarSoda, 1, { x: 730, y: 10, scaleX: 1, scaleY: 1, ease: Expo.easeInOut }, 0.6);
			scene4Timeline.to( scene4Car, 1, { y: 400, ease: Expo.easeInOut }, 0.5);
				
			scene4Loaded = true;
			
			//showGroup(scene4Group);
			//TweenMax.delayedCall(1, hideGroup, [scene4Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			// scene4Group.hideChildren(true);
			// showThenHide(scene4Group);
			
			sceneArray.push(scene4Group);
		}

		return scene.loadDeferral;
	};

	scenes[5].setup = function(options){
		var scene = scenes[5];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		// LOAD ASSETS --------------------------

		var assets = {
			"s5Sidewalk"		: "/s5/sidewalk.png",
			"s5Trees"			: "/s5/trees_day.png",
			"s5Trees2"			: "/s5/trees_night.png",
			"Biker"				: "/icons_finished/Biker.json",
			"Donny"				: "/icons_finished/Donny.json",
			"Bird1"          	: "/icons_finished/Bird1.json",
			"Walking_dog"       : "/icons_finished/Walking_dog.json",
			"Drinking"          	: "/icons_finished/Drinking.json",
			
			"gSkyDayExtra"		: "/sky_day-extended.jpg",
			"gSkyNightExtra"	: "/sky_night-extended.jpg",
			"gSkyDay"			: "/sky_day.jpg",
			"gSkyNightClear"	: "/sky_night.jpg",
			"gSunDay"			: "/sun_day.png",
			"gSunNight"			: "/sun_night.png",
			"gCityDay"			: "/city_day.png",
			"gCityNight"		: "/city_night.png",
			"gMountainsNight"	: "/mountains.png",
			"gOceanDay"			: "/ocean_day.jpg",
			"gOceanNight"		: "/ocean_night.jpg",
			"gStreetDay"		: "/street_day.jpg",
			"gStreetNight"		: "/street_night.jpg",
			"gBuildingsDay"		: "/buildings_day.png",
			"gBuildingsNight"	: "/buildings_night.png",
			"gCarDay"			: "/car_day.png",
			"gCarShadow"		: "/car_shadow.png",
			"gCarNight"			: "/car_night.png",
			"gWheelDay1"		: "/wheel1_day.png",
			"gWheelDay2"		: "/wheel2_day.png",
			"gWheelNight1"		: "/wheel1_night.png",
			"gWheelNight2"		: "/wheel2_night.png",
			"gGlowDay"			: "/glow_day.png",
			"gGlowNight"		: "/glow_night.png",
			"gHeadlights"		: "/headlights.png",

			"wheels_day_f"		: "/icons_finished/wheels_day_f.json",
			"wheels_day_r"		: "/icons_finished/wheels_day_r.json",
			"wheels_night_f"	: "/icons_finished/wheels_night_f.json",
			"wheels_night_r"	: "/icons_finished/wheels_night_r.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// scene.carWheelsDayFrameNames	= loadFrameSequence(loader, imagePath + "/wheels_day/", 99);
		scene.carDayFrameNames			= loadFrameSequence(loader, imagePath + "/car_day/", 66);
		// scene.carWheelsNightFrameNames	= loadFrameSequence(loader, imagePath + "/wheels_night/", 99);
		scene.carNightFrameNames		= loadFrameSequence(loader, imagePath + "/car_night/", 66);
		
		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			// SKYLINE EXTRA
			scene5SkyExtra = new PIXI.Container();
			scene5Group.addChild(scene5SkyExtra);
				scene5SkyExtraDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDayExtra], scene5WidthContainer, 2000);
				scene5SkyExtraDay.tileScale.x = scene5SkyExtraDay.tileScale.y = assetScale;
				scene5SkyExtraDay.position.x = 0;
				scene5SkyExtraDay.position.y = -2000;
				scene5SkyExtraDay.tilePosition.x = 0;
				scene5SkyExtraDay.tilePosition.y = 0;
				scene5SkyExtra.addChild(scene5SkyExtraDay);
				
				scene5SkyExtraNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNightExtra], scene5WidthContainer, 2000);
				scene5SkyExtraNight.tileScale.x = scene5SkyExtraNight.tileScale.y = assetScale;
				scene5SkyExtraNight.position.x = 0;
				scene5SkyExtraNight.position.y = -2000;
				scene5SkyExtraNight.tilePosition.x = 0;
				scene5SkyExtraNight.tilePosition.y = 0;
				scene5SkyExtraNight.alpha = 0;
				scene5SkyExtra.addChild(scene5SkyExtraNight);
				
			// SKYLINE
			scene5City = new PIXI.Container();
			scene5City.scale.x = assetScale;
			scene5City.scale.y = assetScale;
			scene5Group.addChild(scene5City);
				scene5SkyDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyDay], scene5WidthContainer, 476);
				scene5SkyDay.tileScale.x = scene5SkyDay.tileScale.y = assetScale;
				scene5SkyDay.position.x = 0;
				scene5SkyDay.position.y = 0;
				scene5SkyDay.tilePosition.x = 0;
				scene5SkyDay.tilePosition.y = 0;
				scene5City.addChild(scene5SkyDay);
					
				scene5SkyNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNightClear], scene5WidthContainer, 476);
				scene5SkyNight.tileScale.x = scene5SkyNight.tileScale.y = assetScale;
				scene5SkyNight.position.x = 0;
				scene5SkyNight.position.y = 0;
				scene5SkyNight.tilePosition.x = 0;
				scene5SkyNight.tilePosition.y = 0;
				scene5SkyNight.alpha = 0;
				scene5City.addChild(scene5SkyNight);
			
			// SUN
			scene5Sun = new PIXI.Container();
			scene5Sun.position.x = 300;
			scene5Sun.position.y = 0;
			scene5Sun.pivot.x = scene5Sun.pivot.y = 150;
			scene5Group.addChild(scene5Sun);
				scene5SunDay = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSunDay]);
				scene5SunDay.scale.x = scene5SunDay.scale.y = assetScale;
				scene5Sun.addChild(scene5SunDay);
				
				scene5SunNight = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSunNight]);
				scene5SunNight.scale.x = scene5SunNight.scale.y = assetScale;
				scene5SunNight.alpha = 0;
				scene5Sun.addChild(scene5SunNight);
			
			// CITYSCAPE
			scene5City = new PIXI.Container();
			scene5Group.addChild(scene5City);
				scene5CityDay = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityDay]);
				scene5CityDay.scale.x = scene5CityDay.scale.y = assetScale;
				scene5CityDay.position.x = 0;
				scene5CityDay.position.y = 155;
				scene5City.addChild(scene5CityDay);
				
				scene5CityNight = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityNight]);
				scene5CityNight.scale.x = scene5CityNight.scale.y = assetScale;
				scene5CityNight.position.x = 0;
				scene5CityNight.position.y = 155;
				scene5CityNight.alpha = 0;
				scene5City.addChild(scene5CityNight);
				
				var mountains = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gMountainsNight]);
				mountains.scale.x = mountains.scale.y = assetScale;
				mountains.position.x = -1750;
				mountains.position.y = 254;
				scene5City.addChild(mountains);
				
			// OCEAN
			scene5OceanDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanDay], scene1WidthContainer, 608);
			scene5OceanDay.tileScale.x = scene5OceanDay.tileScale.y = assetScale;
			scene5OceanDay.position.x = 0;
			scene5OceanDay.position.y = 472;
			scene5Group.addChild(scene5OceanDay);
			
			scene5OceanNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanNight], scene5WidthContainer, 608);
			scene5OceanNight.tileScale.x = scene1Ocean.tileScale.y = assetScale;
			scene5OceanNight.position.x = 0;
			scene5OceanNight.position.y = 472;
			scene5Group.addChild(scene5OceanNight);
			
			// STREET
			scene5Street = new PIXI.Container();
			scene5Group.addChild(scene5Street);
				// DAY STREET
				scene5StreetDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetDay], scene5WidthContainer, 210);
				scene5StreetDay.tileScale.x = scene5StreetDay.tileScale.y = assetScale;
				scene5StreetDay.position.x = 0;
				scene5StreetDay.position.y = 870;
				scene5StreetDay.tilePosition.x = 0;
				scene5StreetDay.tilePosition.y = 0;
				scene5Street.addChild(scene5StreetDay);
			
				// NIGHT STREET
				scene5StreetNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetNight], scene5WidthContainer, 210);
				scene5StreetNight.tileScale.x = scene5StreetNight.tileScale.y = assetScale;
				scene5StreetNight.position.x = 0;
				scene5StreetNight.position.y = 870;
				scene5StreetNight.tilePosition.x = 0;
				scene5StreetNight.tilePosition.y = 0;
				scene5StreetNight.alpha = 0;
				scene5Street.addChild(scene5StreetNight);

			// BUILDINGS
			scene5Buildings = new PIXI.Container();
			scene5Group.addChild(scene5Buildings);
				// DAY BUILDINGS
				scene5BuildingsDay = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gBuildingsDay]);
				scene5BuildingsDay.scale.x = scene5BuildingsDay.scale.y = assetScale;
				scene5BuildingsDay.position.x = 800;
				scene5BuildingsDay.position.y = 505;
				scene5Buildings.addChild(scene5BuildingsDay);
				
				// NIGHT BUILDINGS
				scene5BuildingsNight = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gBuildingsNight]);
				scene5BuildingsNight.scale.x = scene5BuildingsNight.scale.y = assetScale;
				scene5BuildingsNight.position.x = 800;
				scene5BuildingsNight.position.y = 505;
				scene5BuildingsNight.alpha = 0;
				scene5Buildings.addChild(scene5BuildingsNight);
				
				scene5Sidewalk = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s5Sidewalk]);
				scene5Sidewalk.scale.x = scene5Sidewalk.scale.y = assetScale;
				scene5Sidewalk.position.x = 315;
				scene5Sidewalk.position.y = 729;
				scene5Buildings.addChild(scene5Sidewalk);
				
				// SPRITE Drinking
				var spriteDrinkingTextureArray = makeSpritesFromSheet("Drinking", 74);
				spriteDrinking = new PIXI.extras.MovieClip.fromFrames(spriteDrinkingTextureArray);
				spriteDrinking.scale.x = spriteDrinking.scale.y = assetScale;
				spriteDrinking.position.x = 3600;
				spriteDrinking.position.y = 750;
				spriteDrinking.gotoAndStop(0);
				spriteDrinking.animationSpeed = 0.25;
				scene5Buildings.addChild(spriteDrinking);
				
				// SPRITE Walking_dog
				var spriteWalking_dogTextureArray = makeSpritesFromSheet("Walking_dog", 10);
				spriteWalking_dog = new PIXI.extras.MovieClip.fromFrames(spriteWalking_dogTextureArray);
				spriteWalking_dog.scale.x = spriteWalking_dog.scale.y = assetScale;
				spriteWalking_dog.position.x = 0;
				spriteWalking_dog.scale.x *= -1;
				spriteWalking_dog.position.y = 762;
				spriteWalking_dog.gotoAndStop(0);
				spriteWalking_dog.animationSpeed = 0.25;
				scene5Buildings.addChild(spriteWalking_dog);
					// ADD ANIMATION
					scene5Timeline.fromTo( spriteWalking_dog, 80, { x: buildingGroupBufferLeft }, { x: buildingGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
				
				// SPRITE Biker
				var spriteBikerTextureArray = makeSpritesFromSheet("Biker", 11);
				spriteBiker = new PIXI.extras.MovieClip.fromFrames(spriteBikerTextureArray);
				spriteBiker.scale.x = spriteBiker.scale.y = assetScale;
				spriteBiker.position.x = 0;
				spriteBiker.position.y = 782;
				spriteBiker.gotoAndStop(0);
				spriteBiker.animationSpeed = 0.25;
				scene5Buildings.addChild(spriteBiker);
					// ADD ANIMATION
					scene5Timeline.fromTo( spriteBiker, 40, { x: buildingGroupBufferRight }, { x: buildingGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);
					
				// SPRITE Bird1
				var spriteBird1TextureArray = makeSpritesFromSheet("Bird1", 9);
				spriteBird1 = new PIXI.extras.MovieClip.fromFrames(spriteBird1TextureArray);
				spriteBird1.scale.x = spriteBird1.scale.y = assetScale;
				spriteBird1.scale.x *= -1;
				spriteBird1.position.x = 500;
				spriteBird1.position.y = 500;
				spriteBird1.gotoAndStop(0);
				spriteBird1.animationSpeed = 0.5;
				scene5Buildings.addChild(spriteBird1);
					// ADD ANIMATION
					scene5Timeline.fromTo( spriteBird1, 30, { x: buildingGroupBufferRight }, { x: buildingGroupBufferLeft, repeat: -1, ease: Linear.easeNone }, 0);

			// CAR
			scene.car = new PIXI.Container();
				scene.car.pivot.x = 345;
				scene.car.pivot.y = 430;
				scene.car.position.x = minSiteWidth/2;
				scene.car.position.y = 1080;
			scene5Group.addChild(scene.car);
			
				// DAY CAR
				// ANIMATED CAR
				var car,
					spriteArray,
					carMovieClipArray,
					carBaseTexture,
					carBase;
				car = scene.car.dayCar = new PIXI.Container();

					car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
						car.shadow.scale.x = car.shadow.scale.y = assetScale;
						car.shadow.position.x = -120;
						car.shadow.position.y = 310;
					car.addChild(car.shadow);

					//car textures
					carMovieClipArray = _.map(scene.carDayFrameNames, function(frameName, i){
						return PIXI.utils.TextureCache[frameName];
					});
					
					carBaseTexture = carMovieClipArray.shift();
					carBase = new PIXI.Sprite(carBaseTexture);
						carBase.scale.x = carBase.scale.y = assetScale;
					car.addChild(carBase);

					car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
						car.reflections.scale.x = car.reflections.scale.y = assetScale;
					car.addChild(car.reflections);

					car.wheels = new PIXI.Container();

						spriteArray = makeSpritesFromSheet("wheels_day_f", 99);
						car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
							car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
							car.wheels.front.position.x = 66;
							car.wheels.front.position.y = 234;
						car.wheels.addChild(car.wheels.front);

						spriteArray = makeSpritesFromSheet("wheels_day_r", 99);
						car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
							car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
							car.wheels.rear.position.x = 520;
							car.wheels.rear.position.y = 234;
						car.wheels.addChild(car.wheels.rear);

					car.addChild(car.wheels);
				scene.car.addChild(car);
				
				// NIGHT CAR
				car = scene.car.nightCar = new PIXI.Container();
				car.pivot.x = 0;
				car.pivot.y = 19;


					car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
						car.shadow.scale.x = car.shadow.scale.y = assetScale;
						car.shadow.position.x = -120;
						car.shadow.position.y = 329;
					car.addChild(car.shadow);

					//car textures
					carMovieClipArray = _.map(scene.carNightFrameNames, function(frameName, i){
						return PIXI.utils.TextureCache[frameName];
					});
					
					carBaseTexture = carMovieClipArray.shift();
					carBase = new PIXI.Sprite(carBaseTexture);
						carBase.scale.x = carBase.scale.y = assetScale;
					car.addChild(carBase);

					car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
						car.reflections.scale.x = car.reflections.scale.y = assetScale;
					car.addChild(car.reflections);

					car.wheels = new PIXI.Container();
						spriteArray = makeSpritesFromSheet("wheels_night_f", 99);
						car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
							car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
							car.wheels.front.position.x = 66;
							car.wheels.front.position.y = 253;
						car.wheels.addChild(car.wheels.front);

						spriteArray = makeSpritesFromSheet("wheels_night_r", 99);
						car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
							car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
							car.wheels.rear.position.x = 520;
							car.wheels.rear.position.y = 253;
						car.wheels.addChild(car.wheels.rear);
					car.addChild(car.wheels);

					car.headlights = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHeadlights]);
						car.headlights.scale.x = car.headlights.scale.y = assetScale;
						car.headlights.position.x = -234;
						car.headlights.position.y = -75;
					car.addChild(car.headlights);
				scene.car.addChild(car);
				
				
			// DONNY
			scene5Donny = new PIXI.Container();
			scene5Group.addChild(scene5Donny);
				// SPRITE Donny
				var spriteDonnyTextureArray = makeSpritesFromSheet("Donny", 29);
				spriteDonny = new PIXI.extras.MovieClip.fromFrames(spriteDonnyTextureArray);
				spriteDonny.scale.x = spriteDonny.scale.y = assetScale;
				spriteDonny.position.x = 2000;
				spriteDonny.position.y = 1000;
				spriteDonny.gotoAndStop(0);
				spriteDonny.loop = false;
				spriteDonny.animationSpeed = 0.25;
				scene5Donny.addChild(spriteDonny);

			// SUN GLOW
			scene5GlowDay = new PIXI.Container();
			scene5GlowDay.position.x = 300;
			scene5GlowDay.position.y = 0;
			scene5GlowDay.pivot.x = scene5GlowDay.pivot.y = 250;
			scene5GlowDay.scale.x = 1;
			scene5GlowDay.scale.y = 1;
			scene5Group.addChild(scene5GlowDay);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowDay]);
				glow.scale.x = glow.scale.y = assetScale;
				scene5GlowDay.addChild(glow);
			
			// NIGHT GLOW
			scene5GlowNight = new PIXI.Container();
			scene5GlowNight.position.x = window.innerWidth/2;
			scene5GlowNight.position.y = 472;
			scene5GlowNight.pivot.x = 500;
			scene5GlowNight.pivot.y = 90;
			scene5GlowNight.scale.x = 2;
			scene5GlowNight.scale.y = 2;
			scene5GlowNight.alpha = 0;
			scene5Group.addChild(scene5GlowNight);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene5GlowNight.addChild(glow);
			
			// TREES
			scene5Trees = new PIXI.Container();
			scene5Group.addChild(scene5Trees);
				scene5TreesDay = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s5Trees], scene5WidthContainer, 1080);
				scene5TreesDay.tileScale.x = scene5TreesDay.tileScale.y = assetScale;
				scene5TreesDay.position.x = 0;
				scene5TreesDay.position.y = 0;
				scene5TreesDay.tilePosition.x = 0;
				scene5TreesDay.tilePosition.y = 0;
				scene5Trees.addChild(scene5TreesDay);
				
				scene5TreesNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s5Trees2], scene5WidthContainer, 1080);
				scene5TreesNight.tileScale.x = scene5TreesNight.tileScale.y = assetScale;
				scene5TreesNight.position.x = 0;
				scene5TreesNight.position.y = 0;
				scene5TreesNight.tilePosition.x = 0;
				scene5TreesNight.tilePosition.y = 0;
				scene5TreesNight.alpha = 0;
				scene5Trees.addChild(scene5TreesNight);

			scene5Group.transitionalOverlay = transitionalOverlays[5];
			scene5Group.addChild(scene5Group.transitionalOverlay);
			
			scene5Loaded = true;
			
			//showGroup(scene5Group);
			//TweenMax.delayedCall(1, hideGroup, [scene5Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			// scene5Group.hideChildren(true);
			// showThenHide(scene5Group);
			
			sceneArray.push(scene5Group);
		}

		return scene.loadDeferral;
	};

	scenes[6].setup = function(options){
		var scene = scenes[6];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		// LOAD ASSETS --------------------------
		
		var assets = {
			"s6Sky"		: "/s6/sky.jpg",
			"s6Ocean"	: "/s6/ocean.jpg",
			"s6Bridge"	: "/s6/bridge.png",
			"s6City"	: "/s6/city.png",
			"s6Car"		: "/s6/car.png",

			"gGlowNight": "/glow_night.png",
		};


		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		function onAssetsLoaded() {
			// BACKGROUND
			scene6Bg = new PIXI.Container();
			scene6Bg.pivot.x = 0;
			scene6Bg.pivot.y = 1080;
			scene6Bg.position.x = 0;
			scene6Bg.position.y = 1080;
			scene6Group.addChild(scene6Bg);
				// SKYLINE
				scene6Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s6Sky], 3000, 1080);
				scene6Sky.tileScale.x = scene6Sky.tileScale.y = assetScale;
				scene6Sky.position.x = 0;
				scene6Sky.position.y = 0;
				scene6Sky.tilePosition.x = 0;
				scene6Sky.tilePosition.y = 0;
				scene6Bg.addChild(scene6Sky);
				
				// BRIDGE
				scene6Bridge = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s6Bridge], 3000, 178);
				scene6Bridge.tileScale.x = scene6Bridge.tileScale.y = assetScale;
				scene6Bridge.position.x = 0;
				scene6Bridge.position.y = 211;
				scene6Bridge.tilePosition.x = 0;
				scene6Bridge.tilePosition.y = 0;
				scene6Bg.addChild(scene6Bridge);
				
				// OCEAN
				scene6Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s6Ocean], 3000, 694);
				scene6Ocean.tileScale.x = scene6Ocean.tileScale.y = assetScale;
				scene6Ocean.position.x = 0;
				scene6Ocean.position.y = 1080;
				scene6Ocean.pivot.x = 0;
				scene6Ocean.pivot.y = 694;
				scene6Ocean.tilePosition.x = 0;
				scene6Ocean.tilePosition.y = 0;
				scene6Bg.addChild(scene6Ocean);
				
				// BUILDINGS
				scene6City = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s6City], 3000, 694);
				scene6City.tileScale.x = scene6City.tileScale.y = assetScale;
				scene6City.position.x = 0;
				scene6City.position.y = 1080;
				scene6City.pivot.x = 0;
				scene6City.pivot.y = 694;
				scene6City.tilePosition.x = 0;
				scene6City.tilePosition.y = 0;
				scene6Bg.addChild(scene6City);
			
			// NIGHT GLOW
			scene6Glow = new PIXI.Container();
			scene6Glow.position.x = window.innerWidth/2;
			scene6Glow.position.y = 400;
			scene6Glow.pivot.x = 500;
			scene6Glow.pivot.y = 90;
			scene6Glow.scale.x = 2;
			scene6Glow.scale.y = 2;
			scene6Group.addChild(scene6Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene6Glow.addChild(glow);
			
			// CAR
			scene6Car = new PIXI.Container();
			scene6Car.position.x = minSiteWidth/2;
			scene6Car.position.y = 1200;
			scene6Car.pivot.x = 2000;
			scene6Car.pivot.y = 1000;
			scene6Car.scale.x = .75;
			scene6Car.scale.y = .75;
			if ($html.hasClass("touch")) scene6Car.scale.x =  scene6Car.scale.y = .60;
			scene6Group.addChild(scene6Car);
				var car = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s6Car]);
				car.scale.x = car.scale.y = assetScale;
				scene6Car.addChild(car);

			scene6Group.transitionalOverlay = transitionalOverlays[6];
			scene6Group.addChild(scene6Group.transitionalOverlay);
			
			scene6Loaded = true;
			
			//hideGroup(scene6Group);
			//showGroup(scene6Group);
			//TweenMax.delayedCall(1, hideGroup, [scene6Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene6Group);
		}

		return scenes[6].loadDeferral;
	};

	scenes[7].setup = function(options){
		var scene = scenes[7];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		var assets = {
			"s7Goonies"			: "/s7/goonies.png",
			"s7Cruiseship"		: "/s7/cruiseship.png",
			"s7DxpDude"			: "/s7/dxp_dude.png",
			"s7DxpBubble"		: "/s7/dxp_bubble.png",
			"s7DxpFlash"		: "/s7/dxp_flash.png",
			"s7Trees"			: "/s7/trees.png",
			"Speedboat"         : "/icons_finished/Speedboat.json",
			"Traffic_light"     : "/icons_finished/Traffic_light.json",
			"Walking"          	: "/icons_finished/Walking.json",
			//"Newspapers"          	: "/icons_finished/Newspapers.json",
			"Old_car"          	: "/icons_finished/Old_car.json",

			"gSidewalkNight"	: "/s7/sidewalk.png",
			"gSkyNightExtra"	: "/sky_night-extended.jpg",
			"gSkyNight"			: "/sky_nightstars.jpg",
			"gCloudsNight"		: "/clouds_night.png",
			"gCityNight"		: "/city_night.png",
			"gMountainsNight"	: "/mountains.png",
			"gOceanNight"		: "/ocean_night.jpg",
			"gStreetNight"		: "/street_night.jpg",
			"gFencingNight"		: "/fencing_night.png",
			"gBuildingsNight"	: "/buildings_night.png",
			"gCarShadow"		: "/car_shadow.png",
			"gCarNight"			: "/car_night.png",
			"gWheelNight1"		: "/wheel1_night.png",
			"gWheelNight2"		: "/wheel2_night.png",
			"gHeadlights"		: "/headlights.png",
			"gGlowNight"		: "/glow_night.png",

			"wheels_night_f"	: "/icons_finished/wheels_night_f.json",
			"wheels_night_r"	: "/icons_finished/wheels_night_r.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// scene.carWheelsNightFrameNames	= loadFrameSequence(loader, imagePath + "/wheels_night/", 99);
		scene.carNightFrameNames		= loadFrameSequence(loader, imagePath + "/car_night/", 66);
		
		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		
		function onAssetsLoaded() {
			// SKYLINE EXTRA
			scene7SkyExtra = new PIXI.Container();
			scene7Group.addChild(scene7SkyExtra);
				scene7SkyExtraNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNightExtra], scene7WidthContainer, 2000);
				scene7SkyExtraNight.tileScale.x = scene7SkyExtraNight.tileScale.y = assetScale;
				scene7SkyExtraNight.position.x = 0;
				scene7SkyExtraNight.position.y = -2000;
				scene7SkyExtraNight.tilePosition.x = 0;
				scene7SkyExtraNight.tilePosition.y = 0;
				scene7SkyExtra.addChild(scene7SkyExtraNight);
				
			// SKYLINE
			scene7Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNight], scene7WidthContainer, 476);
			scene7Sky.tileScale.x = scene7Sky.tileScale.y = assetScale;
			scene7Sky.position.x = 0;
			scene7Sky.position.y = 0;
			scene7Sky.tilePosition.x = 0;
			scene7Sky.tilePosition.y = 0;
			scene7Group.addChild(scene7Sky);
			
			// CLOUDS
			scene7Clouds = new PIXI.Container();
			scene7Group.addChild(scene7Clouds);
				var clouds = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCloudsNight]);
				clouds.scale.x = clouds.scale.y = assetScale;
				clouds.position.x = 800;
				clouds.position.y = 205;
				scene7Clouds.addChild(clouds);

			// CITYSCAPE
			scene7City = new PIXI.Container();
			scene7Group.addChild(scene7City);
				var city = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityNight]);
				city.scale.x = city.scale.y = assetScale;
				city.position.x = 750;
				city.position.y = 155;
				scene7City.addChild(city);
				
				var goonies = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s7Goonies]);
				goonies.scale.x = goonies.scale.y = assetScale;
				goonies.position.x = -12500;
				goonies.position.y = 372;
				scene7City.addChild(goonies);
				//TweenMax.fromTo( goonies, 70, { x: -500 }, { x: scene7WidthContainer, repeat: -1, ease: Linear.easeNone });
					scene7Timeline.fromTo( goonies, 100, { x: oceanGroupBufferLeft }, { x: oceanGroupBufferRight, repeat: -1, ease: Linear.easeNone });
				
				var mountains = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gMountainsNight]);
				mountains.scale.x = mountains.scale.y = assetScale;
				mountains.position.x = -1000;
				mountains.position.y = 254;
				scene7City.addChild(mountains);
			
			// OCEAN
			scene7Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanNight], scene7WidthContainer, 608);
			scene7Ocean.tileScale.x = scene7Ocean.tileScale.y = assetScale;
			scene7Ocean.position.x = 0;
			scene7Ocean.position.y = 472;
			scene7Group.addChild(scene7Ocean);
		
			// OCEAN OBJECTS
			scene7OceanObjects = new PIXI.Container();
			scene7Group.addChild(scene7OceanObjects);
				var cruiseship = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s7Cruiseship]);
				cruiseship.scale.x = cruiseship.scale.y = assetScale;
				cruiseship.position.x = 0;
				cruiseship.position.y = 440;
				scene7OceanObjects.addChild(cruiseship);
					// ADD ANIMATION
					scene7Timeline.fromTo( cruiseship, 100, { x: oceanGroupBufferRight }, { x: oceanGroupBufferLeft, repeat: -1, ease: Linear.easeNone });

				// SPRITE Speedboat
				var spriteSpeedboatTextureArray = makeSpritesFromSheet("Speedboat", 14);
				spriteSpeedboat = new PIXI.extras.MovieClip.fromFrames(spriteSpeedboatTextureArray);
				spriteSpeedboat.scale.x = spriteSpeedboat.scale.y = assetScale;
				spriteSpeedboat.position.x = 0;
				spriteSpeedboat.position.y = 530;
				spriteSpeedboat.gotoAndStop(0);
				spriteSpeedboat.animationSpeed = 0.25;
				scene7OceanObjects.addChild(spriteSpeedboat);
					// ADD ANIMATION
					scene7Timeline.fromTo( spriteSpeedboat, 40, { x: oceanGroupBufferLeft }, { x: oceanGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
			
					
			// STREET
			scene7Street = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetNight], scene7WidthContainer, 210);
			scene7Street.tileScale.x = scene7Street.tileScale.y = assetScale;
			scene7Street.position.x = 0;
			scene7Street.position.y = 870;
			scene7Street.tilePosition.x = 0;
			scene7Street.tilePosition.y = 0;
			scene7Group.addChild(scene7Street);
		
			// BUILDINGS
			scene7Buildings = new PIXI.Container();
			scene7Group.addChild(scene7Buildings);
				var fence = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gFencingNight]);
				fence.scale.x = fence.scale.y = assetScale;
				fence.position.x = 1000;
				fence.position.y = 669;
				scene7Buildings.addChild(fence);
				
				var buildings = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gBuildingsNight]);
				buildings.scale.x = buildings.scale.y = assetScale;
				buildings.position.x = 2300;
				buildings.position.y = 505;
				scene7Buildings.addChild(buildings);
				
				var sidewalk = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSidewalkNight]);
				sidewalk.scale.x = sidewalk.scale.y = assetScale;
				sidewalk.position.x = 896;
				sidewalk.position.y = 668;
				scene7Buildings.addChild(sidewalk);
				
				// SPRITE Traffic_light
				var spriteTraffic_lightTextureArray = makeSpritesFromSheet("Traffic_light", 33);
				spriteTraffic_light = new PIXI.extras.MovieClip.fromFrames(spriteTraffic_lightTextureArray);
				spriteTraffic_light.scale.x = spriteTraffic_light.scale.y = assetScale;
				spriteTraffic_light.position.x = 891;
				spriteTraffic_light.position.y = 657;
				spriteTraffic_light.gotoAndStop(0);
				spriteTraffic_light.animationSpeed = 0.1;
				scene7Buildings.addChild(spriteTraffic_light);
				
				// SPRITE Walking
				var spriteWalkingTextureArray = makeSpritesFromSheet("Walking", 10);
				spriteWalking = new PIXI.extras.MovieClip.fromFrames(spriteWalkingTextureArray);
				spriteWalking.scale.x = spriteWalking.scale.y = assetScale;
				spriteWalking.position.x = 0;
				spriteWalking.position.y = 750;
				spriteWalking.gotoAndStop(0);
				spriteWalking.animationSpeed = 0.25;
				scene7Buildings.addChild(spriteWalking);
					// ADD ANIMATION
					scene7Timeline.fromTo( spriteWalking, 60, { x: buildingGroupBufferRight }, { x:buildingGroupBufferLeft , repeat: -1, ease: Linear.easeNone }, 0);
				/*
				// SPRITE Newspapers
				var spriteNewspapersTextureArray = makeSpritesFromSheet("Newspapers", 26);
				spriteNewspapers = new PIXI.extras.MovieClip.fromFrames(spriteNewspapersTextureArray);
				spriteNewspapers.scale.x = spriteNewspapers.scale.y = assetScale;
				spriteNewspapers.position.x = 3500;
				spriteNewspapers.position.y = 675;
				spriteNewspapers.gotoAndStop(0);
				spriteNewspapers.animationSpeed = 0.25;
				scene7Buildings.addChild(spriteNewspapers);
				*/
				
				var dxpDude = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s7DxpDude]);
				dxpDude.scale.x = dxpDude.scale.y = assetScale;
				dxpDude.position.x = 2110;
				dxpDude.position.y = 740;
				scene7Buildings.addChild(dxpDude);

				scene7DxpBubble = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s7DxpBubble]);
				scene7DxpBubble.scale.x = scene7DxpBubble.scale.y = assetScale;
				scene7DxpBubble.position.x = 2018;
				scene7DxpBubble.position.y = 620;
				scene7DxpBubble.alpha = 0;
				scene7Buildings.addChild(scene7DxpBubble);
				
				scene7DxpFlash = new PIXI.Container();
				scene7DxpFlash.position.x = 2110 + 7;
				scene7DxpFlash.position.y = 740 + 20;
				scene7DxpFlash.pivot.x = 250;
				scene7DxpFlash.pivot.y = 250;
				scene7DxpFlash.scale.x = 2;
				scene7DxpFlash.scale.y = 2;
				scene7DxpFlash.alpha = 0;
				scene7Buildings.addChild(scene7DxpFlash);
					var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s7DxpFlash]);
					glow.scale.x = glow.scale.y = assetScale;
					scene7DxpFlash.addChild(glow);
				
				// SPRITE Old_car
				var spriteOld_carTextureArray = makeSpritesFromSheet("Old_car", 10);
				spriteOld_car = new PIXI.extras.MovieClip.fromFrames(spriteOld_carTextureArray);
				spriteOld_car.scale.x = spriteOld_car.scale.y = assetScale;
				spriteOld_car.position.x = 0;
				spriteOld_car.position.y = 800;
				spriteOld_car.gotoAndStop(0);
				spriteOld_car.animationSpeed = 0.25;
				scene7Buildings.addChild(spriteOld_car);
					// ADD ANIMATION
					scene7Timeline.fromTo( spriteOld_car, 30, { x: buildingGroupBufferLeft }, { x: buildingGroupBufferRight, repeat: -1, ease: Linear.easeNone }, 0);
			
			// ANIMATED CAR

			var car,
				spriteArray,
				carMovieClipArray,
				carBaseTexture,
				carBase;
			car = scene.car = new PIXI.Container();

				car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
					car.shadow.scale.x = car.shadow.scale.y = assetScale;
					car.shadow.position.x = -120;
					car.shadow.position.y = 329;
				car.addChild(car.shadow);

				//car textures
				carMovieClipArray = _.map(scene.carNightFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				
				carBaseTexture = carMovieClipArray.shift();
				carBase = new PIXI.Sprite(carBaseTexture);
					carBase.scale.x = carBase.scale.y = assetScale;
				car.addChild(carBase);

				car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
					car.reflections.scale.x = car.reflections.scale.y = assetScale;
				car.addChild(car.reflections);

				car.wheels = new PIXI.Container();
					spriteArray = makeSpritesFromSheet("wheels_night_f", 99);
					car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
						car.wheels.front.position.x = 66;
						car.wheels.front.position.y = 253;
					car.wheels.addChild(car.wheels.front);

					spriteArray = makeSpritesFromSheet("wheels_night_r", 99);
					car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
						car.wheels.rear.position.x = 520;
						car.wheels.rear.position.y = 253;
					car.wheels.addChild(car.wheels.rear);
				car.addChild(car.wheels);
				
				car.headlights = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHeadlights]);
					car.headlights.scale.x = car.headlights.scale.y = assetScale;
					car.headlights.position.x = -234;
					car.headlights.position.y = -75;
				car.addChild(car.headlights);

				car.pivot.x = 345;
				car.pivot.y = 449;
				car.position.x = minSiteWidth/2;
				car.position.y = 1080;

			scene7Group.addChild(car);
			
			// NIGHT GLOW
			scene7Glow = new PIXI.Container();
			scene7Glow.position.x = window.innerWidth/2;
			scene7Glow.position.y = 472;
			scene7Glow.pivot.x = 500;
			scene7Glow.pivot.y = 90;
			scene7Glow.scale.x = 2;
			scene7Glow.scale.y = 2;
			scene7Group.addChild(scene7Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene7Glow.addChild(glow);
			
			// TREES
			scene7Trees = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s7Trees], scene7WidthContainer, 1080);
			scene7Trees.tileScale.x = scene7Trees.tileScale.y = assetScale;
			scene7Trees.position.x = 0;
			scene7Trees.position.y = 0;
			scene7Trees.tilePosition.x = 0;
			scene7Trees.tilePosition.y = 0;
			scene7Group.addChild(scene7Trees);

			scene7Group.transitionalOverlay = transitionalOverlays[7];
			scene7Group.addChild(scene7Group.transitionalOverlay);
			
			scene7Group.flash = new PIXI.Graphics();
			scene7Group.flash.beginFill(0xffffff, 1);
			scene7Group.flash.drawRect(0,0,128,128);
			scene7Group.flash.endFill();
			scene7Group.flash.width = 1920;
			scene7Group.flash.height = 1180;
			scene7Group.flash.alpha = 0;
			scene7Group.addChild(scene7Group.flash);
			
			scene7Loaded = true;
			
			//showGroup(scene7Group);
			//TweenMax.delayedCall(1, hideGroup, [scene7Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene7Group);
		}

		return scene.loadDeferral;
	};

	scenes[8].setup = function(options){
		var scene = scenes[8];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		// LOAD ASSETS --------------------------
	
		var assets = {
			"s8Extra"		: "/s8/extra.png",
			"s8Bg"			: "/s8/background.png",
			"s8Car"			: "/s8/car.png",
			"s8Dots"		: "/s8/dots.png",
			"s8Icons"		: "/s8/icons.png",
			"s8Location"	: "/s8/location.png",

			"gGlowNight"	: "/glow_night.png",
		};
		
		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);


		// LOAD SEQUENCES --------------------------

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);
	
		function onAssetsLoaded() {
			// EXTRA
			scene8Extra = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s8Extra], 4000, 6000);
			scene8Extra.tileScale.x = scene8Extra.tileScale.y = assetScale;
			scene8Extra.position.x = 0;
			scene8Extra.position.y = 0;
			scene8Extra.tilePosition.x = 0;
			scene8Extra.tilePosition.y = 0;
			scene8Extra.pivot.x = 0;
			scene8Extra.pivot.y = 3000;
			scene8Group.addChild(scene8Extra);
			
			// BUILDINGS
			scene8Bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s8Bg], 3460, 1080);
			scene8Bg.tileScale.x = scene8Bg.tileScale.y = assetScale;
			scene8Bg.position.x = 0;
			scene8Bg.position.y = 0;
			scene8Bg.tilePosition.x = 0;
			scene8Bg.tilePosition.y = 0;
			scene8Group.addChild(scene8Bg);
			
			// ICONS
			scene8Icons = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s8Icons], 3460, 1080);
			scene8Icons.tileScale.x = scene8Icons.tileScale.y = assetScale;
			scene8Icons.position.x = 0;
			scene8Icons.position.y = 0;
			scene8Icons.tilePosition.x = 0;
			scene8Icons.tilePosition.y = 0;
			scene8Group.addChild(scene8Icons);
			
			// DOTS
			scene8Dots = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s8Dots], minSiteWidth/2, 10);
			scene8Dots.tileScale.x = scene8Dots.tileScale.y = assetScale;
			scene8Dots.position.x = 0;
			scene8Dots.position.y = 563;
			scene8Dots.tilePosition.x = 0;
			scene8Dots.tilePosition.y = 0;
			scene8Group.addChild(scene8Dots);
			
			// LOCATION PIN
			scene8Location = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s8Location]);
			scene8Location.scale.x = scene8Location.scale.y = assetScale;
			scene8Location.position.x = 0;
			scene8Location.position.y = 570;
			scene8Location.pivot.x = 200;
			scene8Location.pivot.y = 75;
			scene8Group.addChild(scene8Location);
			
			// CAR
			scene8Car = new PIXI.Container();
			scene8Car.position.x = minSiteWidth/2;
			scene8Car.position.y = 570;
			scene8Car.pivot.x = 80;
			scene8Car.pivot.y = 35;
			scene8Group.addChild(scene8Car);
				var car = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s8Car]);
				car.scale.x = car.scale.y = assetScale;
				scene8Car.addChild(car);
			
			// NIGHT GLOW
			scene8Glow = new PIXI.Container();
			scene8Glow.position.x = window.innerWidth/2;
			scene8Glow.position.y = 0;
			scene8Glow.pivot.x = 500;
			scene8Glow.pivot.y = 90;
			scene8Glow.scale.x = 2;
			scene8Glow.scale.y = 2;
			scene8Group.addChild(scene8Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene8Glow.addChild(glow);
			
			scene8Group.transitionalOverlay = transitionalOverlays[8];
			scene8Group.addChild(scene8Group.transitionalOverlay);
			
			scene8Loaded = true;
			
			//hideGroup(scene8Group);
			//showGroup(scene8Group);
			//TweenMax.delayedCall(1, hideGroup, [scene8Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene8Group);
		}

		return scene.loadDeferral;
	};

	scenes[9].setup = function(options){
		var scene = scenes[9];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;
		
		var assets = {
			"s9Customer"		: "/s9/customer.png",
			"s9UfoBeam"			: "/s9/ufo/beam.png",
			"s9UfoCow"			: "/s9/ufo/cow.png",
			"s9UfoShip"			: "/s9/ufo/ufo.png",
			"Noid"          	: "/icons_finished/Noid.json",

			"gSidewalkNight"	: "/s7/sidewalk.png",
			"gHousesNight"		: "/s9/houses.png",
			"gSkyNightExtra"	: "/sky_night-extended.jpg",
			"gSkyNight"			: "/sky_nightstars.jpg",
			"gCityNight"		: "/city_night.png",
			"gMountainsNight"	: "/mountains.png",
			"gOceanNight"		: "/ocean_night.jpg",
			"gStreetNight"		: "/street_night.jpg",
			"gCloudsNight"		: "/clouds_night.png",
			"gFencingNight"		: "/fencing_night.png",
			"gCarShadow"		: "/car_shadow.png",
			"gCarNight"			: "/car_night.png",
			"gWheelNight1"		: "/wheel1_night.png",
			"gWheelNight2"		: "/wheel2_night.png",
			"gHeadlights"		: "/headlights.png",
			"gGlowNight"		: "/glow_night.png",
			"wheels_night_f"	: "/icons_finished/wheels_night_f.json",
			"wheels_night_r"	: "/icons_finished/wheels_night_r.json",

			"rain6"				: "/icons_finished/rain6.json",
			"rain6_2"			: "/icons_finished/rain6_2.json",
			"rain6_3"			: "/icons_finished/rain6_3.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// scene.carWheelsNightFrameNames	= loadFrameSequence(loader, imagePath + "/wheels_night/", 99);
		scene.carNightFrameNames		= loadFrameSequence(loader, imagePath + "/car_night/", 66);
		
		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		function onAssetsLoaded() {
			// SKYLINE EXTRA
			scene9SkyExtra = new PIXI.Container();
			scene9Group.addChild(scene9SkyExtra);
				scene9SkyExtraNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNightExtra], scene9WidthContainer, 2000);
				scene9SkyExtraNight.tileScale.x = scene9SkyExtraNight.tileScale.y = assetScale;
				scene9SkyExtraNight.position.x = 0;
				scene9SkyExtraNight.position.y = -2000;
				scene9SkyExtraNight.tilePosition.x = 0;
				scene9SkyExtraNight.tilePosition.y = 0;
				scene9SkyExtra.addChild(scene9SkyExtraNight);
				
			// SKYLINE
			scene9Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNight], scene9WidthContainer, 476);
			scene9Sky.tileScale.x = scene9Sky.tileScale.y = assetScale;
			scene9Sky.position.x = 0;
			scene9Sky.position.y = 0;
			scene9Sky.tilePosition.x = 0;
			scene9Sky.tilePosition.y = 0;
			scene9Group.addChild(scene9Sky);

			// CLOUDS
			scene9Clouds = new PIXI.Container();
			scene9Group.addChild(scene9Clouds);
				var clouds = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCloudsNight]);
				clouds.scale.x = clouds.scale.y = assetScale;
				clouds.position.x = 1400;
				clouds.position.y = 205;
				scene9Clouds.addChild(clouds);
		
			// CITYSCAPE
			scene9City = new PIXI.Container();
			scene9Group.addChild(scene9City);
				var city = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCityNight]);
				city.scale.x = city.scale.y = assetScale;
				city.position.x = 2000;
				city.position.y = 155;
				scene9City.addChild(city);
				
				var mountains = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gMountainsNight]);
				mountains.scale.x = mountains.scale.y = assetScale;
				mountains.position.x = 250;
				mountains.position.y = 254;
				scene9City.addChild(mountains);

			// OCEAN
			scene9Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanNight], scene9WidthContainer, 608);
			scene9Ocean.tileScale.x = scene9Ocean.tileScale.y = assetScale;
			scene9Ocean.position.x = 0;
			scene9Ocean.position.y = 472;
			scene9Group.addChild(scene9Ocean);
			
			// OCEAN OBJECTS
			scene9OceanObjects = new PIXI.Container();
			scene9Group.addChild(scene9OceanObjects);
		
			// STREET
			scene9Street = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetNight], scene9WidthContainer, 210);
			scene9Street.tileScale.x = scene9Street.tileScale.y = assetScale;
			scene9Street.position.x = 0;
			scene9Street.position.y = 870;
			scene9Street.tilePosition.x = 0;
			scene9Street.tilePosition.y = 0;
			scene9Group.addChild(scene9Street);
			
			// BUILDINGS
			scene9Buildings = new PIXI.Container();
			scene9Group.addChild(scene9Buildings);
				var fence = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gFencingNight]);
				fence.scale.x = fence.scale.y = assetScale;
				fence.position.x = 2400;
				fence.position.y = 669;
				scene9Buildings.addChild(fence);
				
				var sidewalk = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSidewalkNight]);
				sidewalk.scale.x = sidewalk.scale.y = assetScale;
				sidewalk.position.x = 2296;
				sidewalk.position.y = 668;
				scene9Buildings.addChild(sidewalk);
				
				// SPRITE Traffic_light
				var spriteTraffic_lightTextureArray = makeSpritesFromSheet("Traffic_light", 33);
				spriteTraffic_light2 = new PIXI.extras.MovieClip.fromFrames(spriteTraffic_lightTextureArray);
				spriteTraffic_light2.scale.x = spriteTraffic_light2.scale.y = assetScale;
				spriteTraffic_light2.position.x = 2291;
				spriteTraffic_light2.position.y = 657;
				spriteTraffic_light2.gotoAndStop(0);
				spriteTraffic_light2.animationSpeed = 0.1;
				scene9Buildings.addChild(spriteTraffic_light2);

				// UFO
				scene9Ufo = new PIXI.Container();
				scene9Ufo.position.x = 1250;
				scene9Ufo.position.y = 575;
				scene9Buildings.addChild(scene9Ufo);

					scene9UfoBeam = new PIXI.Container();
					scene9UfoBeam.position.y = 10;
					scene9UfoBeam.pivot.x = 60;
					scene9UfoBeam.pivot.y = 0;
					scene9Ufo.addChild(scene9UfoBeam);
						var beam = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s9UfoBeam]);
						beam.scale.x = beam.scale.y = assetScale;
						scene9UfoBeam.addChild(beam);

					scene9UfoCow = new PIXI.Container();
					scene9UfoCow.pivot.x = 60;
					scene9UfoCow.pivot.y = 23;
					scene9Ufo.addChild(scene9UfoCow);
						var cow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s9UfoCow]);
						cow.scale.x = beam.scale.y = assetScale;
						scene9UfoCow.addChild(cow);
		
					scene9UfoShip = new PIXI.Container();
					scene9UfoShip.pivot.x = 60;
					scene9UfoShip.pivot.y = 27;
					scene9Ufo.addChild(scene9UfoShip);
						var ship = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s9UfoShip]);
						ship.scale.x = ship.scale.y = assetScale;
						scene9UfoShip.addChild(ship);

					// UFO ANIMATION IN
					scene9UfoInTimeline.fromTo( scene9UfoShip, 1.5, { x: 400, y: -500, scaleX: 0, scaleY: 0, rotation: -(15 * toRAD), alpha: 0 }, { bezier: {values:[{ x: 0, y: -150 }, { x: -150, y: -100 }] }, scaleX: 0.5, scaleY: 0.5, rotation: (15 * toRAD), alpha: 1, ease: Power4.easeInOut }, 0);
					scene9UfoInTimeline.to( scene9UfoShip, 1, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, ease: Power4.easeInOut }, 1.5);
					scene9UfoInTimeline.fromTo( scene9UfoBeam, 1.1, { scaleX: 0, alpha: 0 }, { scaleX: 1, alpha: 1, ease: Power2.easeInOut }, 2.5);
					scene9UfoInTimeline.fromTo( scene9UfoBeam, 1, { scaleY: 0 }, { scaleY: 1, ease: Power4.easeInOut }, 2.5);
					scene9UfoInTimeline.fromTo( scene9UfoCow, 2, { y: 150, rotation: 0, scaleX: 1, scaleY: 1, alpha: 0 }, { y: 0, rotation: (15 * toRAD), scaleX: 1, scaleY: 1, alpha: 1, ease: Power2.easeIn }, 3.5);
					// UFO ANIMATION OUT
					scene9UfoInTimeline.to( scene9UfoBeam, 1, { scaleX: 0, alpha: 0, ease: Power4.easeOut }, 6);
					scene9UfoInTimeline.to( scene9UfoBeam, 1, { scaleY: 0, ease: Power4.easeIn }, 6);
					scene9UfoInTimeline.to( scene9UfoCow, 1, { scaleX: 0, scaleY: 0, ease: Power4.easeIn }, 6);
					scene9UfoInTimeline.to( scene9UfoCow, 2, { y: -500, alpha: 0, ease: Power4.easeIn }, 7);
					scene9UfoInTimeline.to( scene9UfoShip, 2, { y: -500, alpha: 0, ease: Power4.easeIn }, 7);
					
				// SPRITE Noid
				var spriteNoidTextureArray = makeSpritesFromSheet("Noid", 32);
				spriteNoid = new PIXI.extras.MovieClip.fromFrames(spriteNoidTextureArray);
				spriteNoid.scale.x = spriteNoid.scale.y = assetScale;
				spriteNoid.position.x = 3000;
				spriteNoid.position.y = 650;
				spriteNoid.gotoAndStop(0);
				spriteNoid.loop = false;
				spriteNoid.animationSpeed = 0.25;
				scene9Buildings.addChild(spriteNoid);
					
				var buildings = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHousesNight]);
				buildings.scale.x = buildings.scale.y = assetScale;
				buildings.position.x = 0;
				buildings.position.y = 440;
				scene9Buildings.addChild(buildings);
				
				scene9Customer = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s9Customer]);
				scene9Customer.scale.x = scene9Customer.scale.y = assetScale;
				scene9Customer.position.x = 360;
				scene9Customer.position.y = 670;
				scene9Buildings.addChild(scene9Customer);
					
			// ANIMATED CAR
			var car,
				spriteArray,
				carMovieClipArray,
				carBaseTexture,
				carBase;
			car = scene.car = new PIXI.Container();

				car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
					car.shadow.scale.x = car.shadow.scale.y = assetScale;
					car.shadow.position.x = -120;
					car.shadow.position.y = 329;
				car.addChild(car.shadow);

				//car textures
				carMovieClipArray = _.map(scene.carNightFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				
				carBaseTexture = carMovieClipArray.shift();
				carBase = new PIXI.Sprite(carBaseTexture);
					carBase.scale.x = carBase.scale.y = assetScale;
				car.addChild(carBase);

				car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
					car.reflections.scale.x = car.reflections.scale.y = assetScale;
				car.addChild(car.reflections);

				car.wheels = new PIXI.Container();
					spriteArray = makeSpritesFromSheet("wheels_night_f", 99);
					car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
						car.wheels.front.position.x = 66;
						car.wheels.front.position.y = 253;
					car.wheels.addChild(car.wheels.front);

					spriteArray = makeSpritesFromSheet("wheels_night_r", 99);
					car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
						car.wheels.rear.position.x = 520;
						car.wheels.rear.position.y = 253;
					car.wheels.addChild(car.wheels.rear);
				car.addChild(car.wheels);
				
				car.headlights = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHeadlights]);
					car.headlights.scale.x = car.headlights.scale.y = assetScale;
					car.headlights.position.x = -234;
					car.headlights.position.y = -75;
				car.addChild(car.headlights);

				car.pivot.x = 345;
				car.pivot.y = 449;
				car.position.x = minSiteWidth/2;
				car.position.y = 1080;

			scene9Group.addChild(car);

			// NIGHT GLOW
			scene9Glow = new PIXI.Container();
			scene9Glow.position.x = window.innerWidth/2;
			scene9Glow.position.y = 472;
			scene9Glow.pivot.x = 500;
			scene9Glow.pivot.y = 90;
			scene9Glow.scale.x = 2;
			scene9Glow.scale.y = 2;
			scene9Group.addChild(scene9Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene9Glow.addChild(glow);
			
			// ANIMATED RAIN
			spriteArray = makeSpritesFromSheet("rain6", 6)
				.concat(makeSpritesFromSheet("rain6_2", 6))
				.concat(makeSpritesFromSheet("rain6_3", 4));
			scene.rain = new PIXI.extras.MovieClip.fromFrames(spriteArray);
			scene.rain.scale.x = scene.rain.scale.y = assetScale * 2;
			scene.rain.pivot.x = 0;
			scene.rain.pivot.y = 0;
			// scene.rain.position.x = minSiteWidth / 2;
			// scene.rain.position.y = minSiteHeight;
			scene.rain.gotoAndStop( 0 );
			scene.rain.animationSpeed = 0.5;
			scene9Group.addChild(scene.rain);

			scene9Group.transitionalOverlay = transitionalOverlays[9];
			scene9Group.addChild(scene9Group.transitionalOverlay);

			scene9Loaded = true;
			
			//showGroup(scene9Group);
			//TweenMax.delayedCall(1, hideGroup, [scene9Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene9Group);
		}

		return scene.loadDeferral;
	};

	scenes[10].setup = function(options){
		var scene = scenes[10];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;

		var assets = {
			"s10CarLight"	: "/s10/light.png",
			"s10Car"		: "/s10/car.png",
			"gRoadBgExtra"	: "/s4/extra.jpg",
			"gRoadBg"		: "/s4/background.jpg",
			"gGlowNight"	: "/glow_night.png",
			
			"puddle1"          : "/icons_finished/puddle1.json",
			"puddle2"          : "/icons_finished/puddle2.json",
			"puddle3"          : "/icons_finished/puddle3.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);
		
		function onAssetsLoaded() {
			// EXTRA
			scene10Extra = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gRoadBgExtra], 4000, 6000);
			scene10Extra.tileScale.x = scene10Extra.tileScale.y = assetScale;
			scene10Extra.position.x = 0;
			scene10Extra.position.y = 0;
			scene10Extra.tilePosition.x = 0;
			scene10Extra.tilePosition.y = 0;
			scene10Extra.pivot.x = 0;
			scene10Extra.pivot.y = 3000;
			scene10Group.addChild(scene10Extra);
			
			// BACKGROUND
			scene10Bg = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gRoadBg], 4000, 1080);
			scene10Bg.tileScale.x = scene10Bg.tileScale.y = assetScale;
			scene10Bg.position.x = 0;
			scene10Bg.position.y = 0;
			scene10Bg.tilePosition.x = 0;
			scene10Bg.tilePosition.y = 0;
			scene10Group.addChild(scene10Bg);
				
			// PUDDLES
			scene10Puddles = new PIXI.Container();
			scene10Puddles.position.x = minSiteWidth/2;
			scene10Puddles.position.y = 0;
			scene10Puddles.width = 1500
			scene10Puddles.pivot.x = 750;
			scene10Puddles.pivot.y = 0;
			scene10Group.addChild(scene10Puddles);
			
				// SPRITE puddle1
				var spritepuddle1TextureArray = makeSpritesFromSheet("puddle1", 38);
				spritepuddle1 = new PIXI.extras.MovieClip.fromFrames(spritepuddle1TextureArray);
				spritepuddle1.scale.x = spritepuddle1.scale.y = assetScale;
				spritepuddle1.position.x = 0;
				spritepuddle1.position.y = 250;
				spritepuddle1.gotoAndStop(0);
				spritepuddle1.animationSpeed = 0.2;
				scene10Puddles.addChild(spritepuddle1);
				
				// SPRITE puddle2
				var spritepuddle2TextureArray = makeSpritesFromSheet("puddle2", 38);
				spritepuddle2 = new PIXI.extras.MovieClip.fromFrames(spritepuddle2TextureArray);
				spritepuddle2.scale.x = spritepuddle2.scale.y = assetScale;
				spritepuddle2.position.x = 500;
				spritepuddle2.position.y = 450;
				spritepuddle2.gotoAndStop(0);
				spritepuddle2.animationSpeed = 0.2;
				scene10Puddles.addChild(spritepuddle2);
				
				// SPRITE puddle3
				var spritepuddle3TextureArray = makeSpritesFromSheet("puddle3", 38);
				spritepuddle3 = new PIXI.extras.MovieClip.fromFrames(spritepuddle3TextureArray);
				spritepuddle3.scale.x = spritepuddle3.scale.y = assetScale;
				spritepuddle3.position.x = 1000;
				spritepuddle3.position.y = 350;
				spritepuddle3.gotoAndStop(0);
				spritepuddle3.animationSpeed = 0.2;
				scene10Puddles.addChild(spritepuddle3);
			
			// PUDDLE LIGHT
			scene10CarLight = new PIXI.Container();
			scene10CarLight.position.x = minSiteWidth/2;
			scene10CarLight.position.y = 0;
			scene10CarLight.pivot.x = 1300;
			scene10CarLight.pivot.y = 0;
			scene10CarLight.alpha = 0;
			scene10Group.addChild(scene10CarLight);
				var light = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s10CarLight]);
				light.scale.x = light.scale.y = assetScale;
				scene10CarLight.addChild(light);
			
			// CAR
			scene10Car = new PIXI.Container();
			scene10Car.position.x = minSiteWidth/2;
			scene10Car.position.y = 0;
			scene10Car.pivot.x = 1300;
			scene10Car.pivot.y = 0;
			scene10Group.addChild(scene10Car);
				var car = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s10Car]);
				car.scale.x = car.scale.y = assetScale;
				scene10Car.addChild(car);
			
			// NIGHT GLOW
			scene10Glow = new PIXI.Container();
			scene10Glow.pivot.x = 500;
			scene10Glow.pivot.y = 90;
			scene10Glow.scale.x = 2;
			scene10Glow.scale.y = 2;
			scene10Group.addChild(scene10Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene10Glow.addChild(glow);

			scene10Group.transitionalOverlay = transitionalOverlays[10];
			scene10Group.addChild(scene10Group.transitionalOverlay);
			
			scene10Loaded = true;
			
			//showGroup(scene10Group);
			//TweenMax.delayedCall(1, hideGroup, [scene10Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene10Group);
		}

		return scene.loadDeferral;
	};

	scenes[11].setup = function(options){
		var scene = scenes[11];
		
		console.log("LOADING SCENE ", scene.sceneId);
		
		options = _.extend({
			loadtype: "site",
			loadGroup: [scene.sceneId],
			silentLoad: false,
			loading: true
		}, options);

		_.extend(scene, options);
		
		var loader = scene.loader;
		
		var assets = {
			"s11Redoctober"		: "/s11/redoctober.png",
			"s11Trees"			: "/s11/trees.png",
			"s11Thanks"			: "/s11/thanks.png",
			"Victory_dance"		: "/icons_finished/Victory_dance.json",
			"Shooting_star"     : "/icons_finished/Shooting_star.json",
			
			"gSidewalkNight"	: "/s7/sidewalk.png",
			"gSkyNightExtra"	: "/sky_night-extended.jpg",
			"gSkyNight"			: "/sky_nightstars.jpg",
			"gCloudsNight"		: "/clouds_night.png",
			"gCityNight"		: "/city_night.png",
			"gMountainsNight"	: "/mountains.png",
			"gOceanNight"		: "/ocean_night.jpg",
			"gStreetNight"		: "/street_night.jpg",
			"gFencingNight"		: "/fencing_night.png",
			"gHousesNight"		: "/s9/houses.png",
			"gCarShadow"		: "/car_shadow.png",
			"gCarNight"			: "/car_night.png",
			"gWheelNight1"		: "/wheel1_night.png",
			"gWheelNight2"		: "/wheel2_night.png",
			"gHeadlights"		: "/headlights.png",
			"gGlowNight"		: "/glow_night.png",
			"wheels_night_f"	: "/icons_finished/wheels_night_f.json",
			"wheels_night_r"	: "/icons_finished/wheels_night_r.json",
		};

		assets = _.mapObject(assets, modifyAssetURL);
		loadAssetList(loader, assets);

		// LOAD SEQUENCES --------------------------

		// scene.carWheelsNightFrameNames	= loadFrameSequence(loader, imagePath + "/wheels_night/", 99);
		scene.carNightFrameNames		= loadFrameSequence(loader, imagePath + "/car_night/", 66);
		
		// LOADER HANDLERS --------------------------

		loader.on('progress', function(){
			reportLoadProgress(scene);
		});

		loader.load(onAssetsLoaded);

		function onAssetsLoaded(){
			// SKYLINE EXTRA
			scene11SkyExtra = new PIXI.Container();
			scene11Group.addChild(scene11SkyExtra);
				scene11SkyExtraNight = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNightExtra], scene11WidthContainer, 2000);
				scene11SkyExtraNight.tileScale.x = scene11SkyExtraNight.tileScale.y = assetScale;
				scene11SkyExtraNight.position.x = 0;
				scene11SkyExtraNight.position.y = -2000;
				scene11SkyExtraNight.tilePosition.x = 0;
				scene11SkyExtraNight.tilePosition.y = 0;
				scene11SkyExtra.addChild(scene11SkyExtraNight);
				
			// SKYLINE
			scene11Sky = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gSkyNight], scene11WidthContainer, 476);
			scene11Sky.tileScale.x = scene11Sky.tileScale.y = assetScale;
			scene11Sky.position.x = 0;
			scene11Sky.position.y = 0;
			scene11Sky.tilePosition.x = 0;
			scene11Sky.tilePosition.y = 0;
			scene11Group.addChild(scene11Sky);

			// SPRITE Shooting_star
			var spriteShooting_starTextureArray = makeSpritesFromSheet("Shooting_star", 7);
			spriteShooting_star = new PIXI.extras.MovieClip.fromFrames(spriteShooting_starTextureArray);
			spriteShooting_star.scale.x = spriteShooting_star.scale.y = assetScale;
			spriteShooting_star.position.x = 500;
			spriteShooting_star.position.y = 50;
			spriteShooting_star.gotoAndStop(0);
			spriteShooting_star.animationSpeed = 0.25;
			spriteShooting_star.loop = false;
			scene11Group.addChild(spriteShooting_star);

			// CLOUDS
			scene11Clouds = new PIXI.Container();
			scene11Group.addChild(scene11Clouds);
				var clouds = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCloudsNight]);
				clouds.scale.x = clouds.scale.y = assetScale;
				clouds.position.x = 0;
				clouds.position.y = 205;
				scene11Clouds.addChild(clouds);
			
			// CITYSCAPE
			scene11City = new PIXI.Container();
			scene11Group.addChild(scene11City);
				var mountains = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gMountainsNight]);
				mountains.scale.x = mountains.scale.y = assetScale;
				mountains.position.x = 1250;
				mountains.position.y = 254;
				scene11City.addChild(mountains);

			// OCEAN
			scene11Ocean = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gOceanNight], scene11WidthContainer, 608);
			scene11Ocean.tileScale.x = scene11Ocean.tileScale.y = assetScale;
			scene11Ocean.position.x = 0;
			scene11Ocean.position.y = 472;
			scene11Group.addChild(scene11Ocean);
			
			// OCEAN OBJECTS
			scene11OceanObjects = new PIXI.Container();
			scene11Group.addChild(scene11OceanObjects);	
				var redoctober = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s11Redoctober]);
				redoctober.scale.x = redoctober.scale.y = assetScale;
				redoctober.position.x = 1500;
				redoctober.position.y = 460;
				scene11OceanObjects.addChild(redoctober);
					// LOOPING ANIMATION
					scene11Timeline.fromTo( redoctober, 100, { x: oceanGroupBufferRight }, { x: oceanGroupBufferLeft - 250, repeat: -1, ease: Linear.easeNone }, 0)

			// STREET
			scene11Street = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.gStreetNight], scene11WidthContainer, 210);
			scene11Street.tileScale.x = scene11Street.tileScale.y = assetScale;
			scene11Street.position.x = 0;
			scene11Street.position.y = 870;
			scene11Street.tilePosition.x = 0;
			scene11Street.tilePosition.y = 0;
			scene11Group.addChild(scene11Street);

			// BUILDINGS
			scene11Buildings = new PIXI.Container();
			scene11Group.addChild(scene11Buildings);
				var fence = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gFencingNight]);
				fence.scale.x = fence.scale.y = assetScale;
				fence.position.x = -700;
				fence.position.y = 669;
				scene11Buildings.addChild(fence);
				
				var sidewalk = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gSidewalkNight]);
				sidewalk.scale.x = sidewalk.scale.y = assetScale;
				sidewalk.position.x = -596;
				sidewalk.position.y = 668;
				scene11Buildings.addChild(sidewalk);
				
				var buildings = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHousesNight]);
				buildings.scale.x = buildings.scale.y = assetScale;
				buildings.position.x = 3300;
				buildings.position.y = 440;
				scene11Buildings.addChild(buildings);
				
				var thanks = new PIXI.Sprite(PIXI.utils.TextureCache[assets.s11Thanks]);
				thanks.scale.x = thanks.scale.y = assetScale;
				thanks.position.x = 3570;
				thanks.position.y = 582;
				scene11Buildings.addChild(thanks);
				
				// ANIMATED DUDE
				var spriteVictory_danceTextureArray = makeSpritesFromSheet("Victory_dance", 40);
				spriteVictory_dance = new PIXI.extras.MovieClip.fromFrames(spriteVictory_danceTextureArray);
				spriteVictory_dance.scale.x = spriteVictory_dance.scale.y = assetScale;
				spriteVictory_dance.position.x = 3640;
				spriteVictory_dance.position.y = 662;
				spriteVictory_dance.gotoAndStop(0);
				spriteVictory_dance.animationSpeed = 0.1;
				scene11Buildings.addChild(spriteVictory_dance);
			
			// ANIMATED CAR
			var car,
				spriteArray,
				carMovieClipArray,
				carBaseTexture,
				carBase;
			car = scene.car = new PIXI.Container();

				car.shadow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gCarShadow]);
					car.shadow.scale.x = car.shadow.scale.y = assetScale;
					car.shadow.position.x = -120;
					car.shadow.position.y = 329;
				car.addChild(car.shadow);

				//car textures
				carMovieClipArray = _.map(scene.carNightFrameNames, function(frameName, i){
					return PIXI.utils.TextureCache[frameName];
				});
				
				carBaseTexture = carMovieClipArray.shift();
				carBase = new PIXI.Sprite(carBaseTexture);
					carBase.scale.x = carBase.scale.y = assetScale;
				car.addChild(carBase);

				car.reflections = new PIXI.extras.MovieClip(carMovieClipArray);
					car.reflections.scale.x = car.reflections.scale.y = assetScale;
				car.addChild(car.reflections);

				car.wheels = new PIXI.Container();
					spriteArray = makeSpritesFromSheet("wheels_night_f", 99);
					car.wheels.front = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.front.scale.x = car.wheels.front.scale.y = assetScale;
						car.wheels.front.position.x = 66;
						car.wheels.front.position.y = 253;
					car.wheels.addChild(car.wheels.front);

					spriteArray = makeSpritesFromSheet("wheels_night_r", 99);
					car.wheels.rear = new PIXI.extras.MovieClip.fromFrames(spriteArray);
						car.wheels.rear.scale.x = car.wheels.rear.scale.y = assetScale;
						car.wheels.rear.position.x = 520;
						car.wheels.rear.position.y = 253;
					car.wheels.addChild(car.wheels.rear);
				car.addChild(car.wheels);
				
				car.headlights = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gHeadlights]);
					car.headlights.scale.x = car.headlights.scale.y = assetScale;
					car.headlights.position.x = -234;
					car.headlights.position.y = -75;
				car.addChild(car.headlights);

				car.pivot.x = 345;
				car.pivot.y = 449;
				car.position.x = minSiteWidth/2;
				car.position.y = 1080;
			scene11Group.addChild(car);
			
			// NIGHT GLOW
			scene11Glow = new PIXI.Container();
			scene11Glow.position.x = window.innerWidth/2;
			scene11Glow.position.y = 472;
			scene11Glow.pivot.x = 500;
			scene11Glow.pivot.y = 90;
			scene11Glow.scale.x = 2;
			scene11Glow.scale.y = 2;
			scene11Group.addChild(scene11Glow);
				var glow = new PIXI.Sprite(PIXI.utils.TextureCache[assets.gGlowNight]);
				glow.scale.x = glow.scale.y = assetScale;
				scene11Glow.addChild(glow);
			
			// TREES
			scene11Trees = new PIXI.extras.TilingSprite(PIXI.utils.TextureCache[assets.s11Trees], scene11WidthContainer, 1080);
			scene11Trees.tileScale.x = scene11Trees.tileScale.y = assetScale;
			scene11Trees.position.x = 0;
			scene11Trees.position.y = 0;
			scene11Trees.tilePosition.x = 0;
			scene11Trees.tilePosition.y = 0;
			scene11Group.addChild(scene11Trees);

			scene11Group.transitionalOverlay = transitionalOverlays[11];
			scene11Group.addChild(scene11Group.transitionalOverlay);
			
			scene11Loaded = true;
			
			//showGroup(scene11Group);
			//TweenMax.delayedCall(1, hideGroup, [scene11Group]);
			
			scene.loading = false;
			scene.loaded = true;
			scene.loadDeferral.resolve(options);
			
			sceneArray.push(scene11Group);
		}

		return scene.loadDeferral;
	};
}


var initEverything = function() {
	targetX = 0;
	currentTireRotation = 0;
	
	onResize();

	//hideAllScenes();
	showGroup(scene1Group);
	page.loadPromise.resolve();
	transitionOpen();
};

function transitionClose(sceneId, jumpTargetX) {
	inTransition = true;
	TweenMax.fromTo( transitionRectMain, 0.5, { alpha: 0 }, { alpha: 1, ease: Linear.easeNone, onStart: function() {
		transitionRectMain.visible = true;
		$(".textbox, .textbox-bottom").removeClass("active");
	}, onComplete: function() {
		changeScene(sceneId, jumpTargetX);
	}});
}

function transitionOpen() {
	TweenMax.fromTo( transitionRectMain, 0.5, { alpha: 1 }, { alpha: 0, delay: 0.5, ease: Linear.easeNone, onStart: function() {
		inTransition = false;
	}, onComplete: function() {
		transitionRectMain.visible = false;
		animationBufferUpdate("normal")
	}});
}

function changeScene(sceneId, jumpTargetX) {
	hideAllScenes();
	animationBufferUpdate("instant");

	currentX = targetX = jumpTargetX;
	
	transitionOpen();
}

function hideAllScenes() {
	//console.log(">>>>>>>>>>>>>>>>>>>> HIDE ALL");
	for (var i=0; i < sceneArray.length; i++) {
		hideGroup(sceneArray[i]);
	};
				
}

function triggerSceneStart(sceneId){
	app.trigger("start", {
		"sceneId": sceneId
	});
}

function triggerSceneStatus(sceneId, percent){
	app.trigger("progress", {
		"sceneId": sceneId,
		"progress": percent
	});
}

function showGroup(sceneName) {
	if (sceneName.visible === true) return;
	sceneName.visible = true;
	// SPECIAL RESIZE BECAUSE HAVE UNIQUE BACKGROUNDS
	if (sceneName.name == "scene6Group" || sceneName.name == "scene6Group" || sceneName.name == "scene10Group") {
		onResize();
	}
	//console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>> SHOW " + sceneName.name);
}

function hideGroup(sceneName) {
	if (sceneName.visible === false) return;
	sceneName.visible = false;
	//console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>> HIDE " + sceneName.name);
}

var speed = 0;
var friction = 0.95;

function animate(){
	requestId = requestAnimationFrame( animate );
	renderer.render( stage );
	
	//if (inTransition === true) return;

	var activeScene = _.findWhere(scenes, {active: true});
	if (activeScene && needsToBuffer(activeScene)){
		allowSilentLoading = false;
		return;
	} else {
		allowSilentLoading = true;
	}

	// speed *= friction;
	// targetX += speed;
	
	currentX += ( targetX - currentX ) * animationBuffer;
	currentXPos = -currentX; 

	// POSITION EVERYTHING
	updateMasks();
	updateSceneElements();
	updateProgress();
	updateText();

	// TRIGGER TRANSITION TO 360
	if (currentSceneId === 11 && currentScenePercentage === 1){
		currentXPos = -maxTargetX - 100;
		targetX = maxTargetX - 100;
		currentScenePercentage = -0.95;
		app.router.navigate("#explore", {trigger:true});
	}
	
	prevPosition = tempPosition;
	//console.log(currentX + " / " + currentXPos + " / " + prevPosition + " / " + tempPosition);
}

function transitionCoverupAnim(type, direction, duration, delta) {
	var OVERLAY_TRANSITION_TIME = duration  + .1;
	var TRANSITION_TIME_DELTA = delta;
	if (type == "tree") {
		if (direction === "right") {
			TweenMax.fromTo(transitionTree, OVERLAY_TRANSITION_TIME, { x: 0 }, { x: windowFullWidthDifference + 300, delay: TRANSITION_TIME_DELTA, overwrite: true, onStart: function() {
				showGroup(transitionTree);
			}, onComplete: function() {
				hideGroup(transitionTree);
			}});
		} else {
			TweenMax.fromTo(transitionTree, OVERLAY_TRANSITION_TIME, { x: windowFullWidthDifference + 300 }, { x: -300, delay: TRANSITION_TIME_DELTA, overwrite: true, onStart: function() {
				showGroup(transitionTree);
			}, onComplete: function() {
				hideGroup(transitionTree);
			}});
		}
	}
	if (type == "bird") {
		if (direction === "right") {
			TweenMax.fromTo(transitionBird, OVERLAY_TRANSITION_TIME, { x: 0, y: (1080 - windowHalfHeight), rotation: (180 * toRAD) }, { x: windowFullWidthDifference + 300, y: (1080 - windowHalfHeight), rotation: (180 * toRAD), delay: TRANSITION_TIME_DELTA, overwrite: true, onStart: function() {
				showGroup(transitionBird);
			}, onComplete: function() {
				hideGroup(transitionBird);
			}});
			
		} else {
			TweenMax.fromTo(transitionBird, OVERLAY_TRANSITION_TIME, { x: windowFullWidthDifference + 300, y: (1080 - windowHalfHeight), rotation: (0 * toRAD) }, { x: -300, y: (1080 - windowHalfHeight), rotation: (0 * toRAD), delay: TRANSITION_TIME_DELTA, overwrite: true, onStart: function() {
				showGroup(transitionBird);
			}, onComplete: function() {
				hideGroup(transitionBird);
			}});
		}
	}
}

function updateMasks() {
	//if (inTransition === true) return;
	
	if (inTransition === true) {
		//console.log("currentSceneId = " + currentSceneId);
		if (scene0Loaded) scene0Group.transitionalOverlay.alpha = 0;
		if (scene1Loaded) scene1Group.transitionalOverlay.alpha = 0;
		if (scene2Loaded) scene2Group.transitionalOverlay.alpha = 0;
		if (scene3Loaded) scene3Group.transitionalOverlay.alpha = 0;
		if (scene4Loaded) scene4Group.transitionalOverlay.alpha = 0;
		if (scene5Loaded) scene5Group.transitionalOverlay.alpha = 0;
		if (scene6Loaded) scene6Group.transitionalOverlay.alpha = 0;
		if (scene7Loaded) scene7Group.transitionalOverlay.alpha = 0;
		if (scene8Loaded) scene8Group.transitionalOverlay.alpha = 0;
		if (scene9Loaded) scene9Group.transitionalOverlay.alpha = 0;
		if (scene10Loaded) scene10Group.transitionalOverlay.alpha = 0;
		if (scene11Loaded) scene11Group.transitionalOverlay.alpha = 0;
		//console.log(currentSceneId);
		if (previousSceneId === currentSceneId) return;
		previousSceneId = currentSceneId;
		switch (currentSceneId){
			case 0:
				maskZone1Placement = "left";
				maskZone2Placement = "left";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = -windowFullWidth;
				transitionMask2.position.x = -windowFullWidth;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene0Group);
				showGroup(scene1Group);
				break;
			case 1:
				maskZone1Placement = "left";
				maskZone2Placement = "left";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = -windowFullWidth;
				transitionMask2.position.x = -windowFullWidth;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene1Group);
				showGroup(scene2Group);
				break;
			case 2:
				maskZone1Placement = "center";
				maskZone2Placement = "left";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = 0;
				transitionMask2.position.x = -windowFullWidth;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;	
				
				showGroup(scene2Group);
				showGroup(scene3Group);
				break;
			case 3:
				maskZone1Placement = "right";
				maskZone2Placement = "left";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";	
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = -windowFullWidth;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene3Group);
				showGroup(scene4Group);
				break;
			case 4:
				maskZone1Placement = "right";
				maskZone2Placement = "center";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = 0;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene4Group);
				showGroup(scene5Group);
				break;
			case 5:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "left";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = -windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene5Group);
				showGroup(scene6Group);
				break;
			case 6:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "center";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = 0;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene6Group);
				showGroup(scene7Group);
				break;
			case 7:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "right";
				maskZone4Placement = "left";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = windowFullWidth;
				transitionMask4.position.x = -windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene7Group);
				showGroup(scene8Group);
				break;
			case 8:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "right";
				maskZone4Placement = "center";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = windowFullWidth;
				transitionMask4.position.x = 0;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene8Group);
				showGroup(scene9Group);
				break;
			case 9:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "right";
				maskZone4Placement = "right";
				maskZone5Placement = "left";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = windowFullWidth;
				transitionMask4.position.x = windowFullWidth;
				transitionMask5.position.x = -windowFullWidth;
				
				showGroup(scene9Group);
				showGroup(scene10Group);
				break;
			case 10:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "right";
				maskZone4Placement = "right";
				maskZone5Placement = "center";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = windowFullWidth;
				transitionMask4.position.x = windowFullWidth;
				transitionMask5.position.x = 0;
				
				showGroup(scene10Group);
				showGroup(scene11Group);
				break;
			case 11:
				maskZone1Placement = "right";
				maskZone2Placement = "right";
				maskZone3Placement = "right";
				maskZone4Placement = "right";
				maskZone5Placement = "right";
				
				transitionMask1.position.x = windowFullWidth;
				transitionMask2.position.x = windowFullWidth;
				transitionMask3.position.x = windowFullWidth;
				transitionMask4.position.x = windowFullWidth;
				transitionMask5.position.x = windowFullWidth;
				
				showGroup(scene11Group);
				break;
		}
	} else {		
		//scene0Group.position.x += ( targetX - scene0Group.position.x ) * animationBuffer;
		var MASK_TRANSITION_TIME = 1;
		var OVERLAY_TRANSITION_TIME	= 0.5;
		var OVARLAY_DARK_ALPHA		= 1;
		var TRANSITION_TIME_DELTA   = 0;	//MASK_TRANSITION_TIME - OVERLAY_TRANSITION_TIME;
		// SCENE 2 MASK
		if (scene2Active) {
			var previousPlacement = maskZone1Placement;
			if (maskZone1Placement !="center") {
				if (maskZone1Placement === "left") transitionCoverupAnim("tree", "right", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				if (maskZone1Placement === "right") transitionCoverupAnim("tree", "left", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone1Placement = "center";
				TweenMax.to( transitionMask1, MASK_TRANSITION_TIME, { x: 0, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene2Group);
					TweenMax.fromTo(scene1Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene2Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene3Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					if (previousPlacement === "left") {
						showGroup(scene3Group);
					} else {
						hideGroup(scene3Group);
					}
					hideGroup(scene1Group);
				}});
			}
		} else {
			if (currentXPos > maskZone1On && maskZone1Placement != "left") {
				transitionCoverupAnim("tree", "left", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone1Placement = "left";
				TweenMax.to( transitionMask1, MASK_TRANSITION_TIME, { x: -windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene1Group);
					TweenMax.fromTo(scene1Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene2Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene2Group);
				}});
			}
			if (currentXPos < maskZone1X && maskZone1Placement != "right") {
				transitionCoverupAnim("tree", "right", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone1Placement = "right";
				TweenMax.to( transitionMask1, MASK_TRANSITION_TIME, { x: windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					hideGroup(scene1Group);
					
					showGroup(scene3Group);
					TweenMax.fromTo(scene2Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene3Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene2Group);
					showGroup(scene4Group);
				}});
			}
		}
		
		// SCENE 4 MASK
		if (scene4Active) {
			var previousPlacement = maskZone2Placement;
			if (maskZone2Placement !="center") {
				maskZone2Placement = "center";
				TweenMax.to( transitionMask2, MASK_TRANSITION_TIME, { x: 0, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene4Group);
					TweenMax.fromTo(scene3Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene4Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene5Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					if (previousPlacement === "left") {
						showGroup(scene5Group);
					} else {
						hideGroup(scene5Group);
					}
					hideGroup(scene3Group);
				}});
			}
		} else {
			if (currentXPos > maskZone2On && maskZone2Placement != "left") {
				maskZone2Placement = "left";
				TweenMax.to( transitionMask2, MASK_TRANSITION_TIME, { x: -windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene3Group);
					TweenMax.fromTo(scene3Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene4Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene4Group);
				}});
			}
			if (currentXPos < maskZone2X && maskZone2Placement != "right") {
				maskZone2Placement = "right";
				TweenMax.to( transitionMask2, MASK_TRANSITION_TIME, { x: windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					hideGroup(scene1Group);
					hideGroup(scene3Group);
					
					showGroup(scene5Group);
					TweenMax.fromTo(scene4Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene5Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene4Group);
					showGroup(scene6Group);
				}});
			}
		}
		
		// SCENE 6 MASK
		if (scene6Active) {
			var previousPlacement = maskZone3Placement;
			if (maskZone3Placement !="center") {
				maskZone3Placement = "center";
				TweenMax.to( transitionMask3, MASK_TRANSITION_TIME, { x: 0, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene6Group);
					TweenMax.fromTo(scene5Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene6Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene7Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					if (previousPlacement === "left") {
						showGroup(scene7Group);
					} else {
						hideGroup(scene7Group);
					}
					hideGroup(scene5Group);
				}});
			
			}
		} else {
			if (currentXPos > maskZone3On && maskZone3Placement != "left") {
				maskZone3Placement = "left";
				TweenMax.to( transitionMask3, MASK_TRANSITION_TIME, { x: -windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene5Group);
					TweenMax.fromTo(scene5Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene6Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene6Group);
				}});
			}
			if (currentXPos < maskZone3X && maskZone3Placement != "right") {
				maskZone3Placement = "right";
				TweenMax.to( transitionMask3, MASK_TRANSITION_TIME, { x: windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					hideGroup(scene1Group);
					hideGroup(scene3Group);
					hideGroup(scene5Group);
					
					showGroup(scene7Group);
					TweenMax.fromTo(scene6Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene7Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene6Group);
					showGroup(scene8Group);
				}});
			}
		}	
		
		// SCENE 8 MASK
		if (scene8Active) {
			var previousPlacement = maskZone4Placement;
			if (maskZone4Placement !="center") {
				if (maskZone4Placement === "left") transitionCoverupAnim("bird", "right", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				if (maskZone4Placement === "right") transitionCoverupAnim("bird", "left", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone4Placement = "center";
				TweenMax.to( transitionMask4, MASK_TRANSITION_TIME, { x: 0, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene8Group);
					TweenMax.fromTo(scene7Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene8Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene9Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					if (previousPlacement === "left") {
						showGroup(scene9Group);
					} else {
						hideGroup(scene9Group);
					}
					hideGroup(scene7Group);
				}});
			}
		} else {
			if (currentXPos > maskZone4On && maskZone4Placement != "left") {
				transitionCoverupAnim("bird", "left", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone4Placement = "left";
				TweenMax.to( transitionMask4, MASK_TRANSITION_TIME, { x: -windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene7Group);
					TweenMax.fromTo(scene7Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene8Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene8Group);
				}});
			}
			if (currentXPos < maskZone4X && maskZone4Placement != "right") {
				transitionCoverupAnim("bird", "right", OVERLAY_TRANSITION_TIME, TRANSITION_TIME_DELTA);
				maskZone4Placement = "right";
				TweenMax.to( transitionMask4, MASK_TRANSITION_TIME, { x: windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					hideGroup(scene1Group);
					hideGroup(scene3Group);
					hideGroup(scene5Group);
					hideGroup(scene7Group);
					
					showGroup(scene9Group);
					TweenMax.fromTo(scene8Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene9Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene8Group);
					showGroup(scene10Group);
				}});
			}
		}
		
		// SCENE 10 MASK
		if (scene10Active) {
			var previousPlacement = maskZone5Placement;
			if (maskZone5Placement !="center") {
				maskZone5Placement = "center";
				TweenMax.to( transitionMask5, MASK_TRANSITION_TIME, { x: 0, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene10Group);
					TweenMax.fromTo(scene9Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene10Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene11Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					if (previousPlacement === "left") {
						showGroup(scene11Group);
					} else {
						hideGroup(scene11Group);
					}
					hideGroup(scene9Group);
				}});
			}
		} else {
			var previousPlacement = maskZone5Placement;
			if (currentXPos > maskZone5On && maskZone5Placement != "left") {
				maskZone5Placement = "left";
				TweenMax.to( transitionMask5, MASK_TRANSITION_TIME, { x: -windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					showGroup(scene9Group);
					TweenMax.fromTo(scene10Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
					TweenMax.fromTo(scene9Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene10Group);
				}});
			}
			if (currentXPos < maskZone5X && maskZone5Placement != "right") {
				maskZone5Placement = "right";
				TweenMax.to( transitionMask5, MASK_TRANSITION_TIME, { x: windowFullWidth, ease: Power4.easeOut, delay: 0, onStart: function() {
					hideGroup(scene1Group);
					hideGroup(scene3Group);
					hideGroup(scene5Group);
					hideGroup(scene7Group);
					hideGroup(scene9Group);
					
					showGroup(scene11Group);
					TweenMax.fromTo(scene11Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: OVARLAY_DARK_ALPHA}, {alpha: 0, overwrite: true});
					TweenMax.fromTo(scene10Group.transitionalOverlay, OVERLAY_TRANSITION_TIME, {alpha: 0}, {alpha: OVARLAY_DARK_ALPHA, delay: TRANSITION_TIME_DELTA, overwrite: true});
				}, onComplete: function() {
					hideGroup(scene10Group);
				}});
			}
		}

	}
	
}



var tempPosition = 0;
var prevPosition = 0;
var animationBuffer = 1;
var animationBufferSite = .5;

function animationBufferUpdate(speed) {
	switch (speed) {
		case "fast":
			animationBuffer = 0.5;
			break;
		case "normal":
			animationBuffer = 0.1;
			break;
		case "slow":
			animationBuffer = 0.04;
			break;
		case "instant":
			animationBuffer = 1;
			break;
	}
}

function updateSceneElements() {
	if (inTransition === true) return;
	currentTireRotation += ((targetX * 0.01) - currentTireRotation ) * animationBuffer;
	tempPosition += ( targetX - tempPosition ) * animationBuffer;
	
	if ( currentXPos >= -500 ) {
		TweenMax.to( ["#scene-menu", "header #main-logo"], 0.1, { autoAlpha: 0 });
	} else {
		TweenMax.to( ["#scene-menu", "header #main-logo"], 1, { autoAlpha: 1 });
	}
	
	if (scene0Loaded) {
		if (scene0Active) {
			var ovenFramesTotal = scenes[0].warmingOvenFrameNames.length-1;
			var ovenFrameScenePercentage = windowFullWidth/4;
			var ovenFrame = Math.floor( ovenFramesTotal * (( tempPosition / ovenFrameScenePercentage )) );
			if (ovenFrame >= ovenFramesTotal) ovenFrame = ovenFramesTotal;
			scene0CarOven.gotoAndStop(ovenFrame);
			
			scene0Timeline.play();
			app.media.pauseSound("crickets");

			triggerBetween(5, 500, function(){
				if (!useSound) return;
				app.media.playSound("warming-door");
			}, function(){
				if (!useSound) return;
				if (!carStarted){
					app.media.playSound("car-start");
					app.media.playSound("car-bg");
					carStarted = true;
				}
			});
		} else {
			scene0Timeline.pause();
		}
	}
	
	if (scene1Loaded) {
		if (scene1Active) {
			spriteB747.play();
			spritePiper.play();
			//spriteBird2.play();
			spriteYacht.play();
			spriteWaving.play();
			spritePhone.play();
			spriteDrinking_torso.play();
			spriteEating_torso.play();
			spritePhone_torso.play();
			spriteTalking_torso.play();

			triggerBetween(1,-(maskZone1On - windowFullWidth),
				function(){
					if (!useSound) return;
					app.media.playSound("day-bg");
					app.media.pauseSound("crickets");
					app.media.pauseSound("rain");

				}, function(){

				});

			
			scene1Timeline.play();
		} else {
			spriteB747.stop();
			spritePiper.stop();
			//spriteBird2.stop();
			spriteYacht.stop();
			spriteWaving.stop();
			spritePhone.stop();
			spriteDrinking_torso.stop();
			spriteEating_torso.stop();
			spritePhone_torso.stop();
			spriteTalking_torso.stop();
			
			scene1Timeline.pause();
		}
		var scene = scenes[1];

		updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections);
		
		scene1Clouds.position.x += (((targetX - scene1WidthContainer) * 0.15) - scene1Clouds.position.x ) * animationBuffer;
		scene1City.position.x += (((targetX - scene1WidthContainer) * 0.20) - scene1City.position.x ) * animationBuffer;
		scene1Ocean.tilePosition.x += ((targetX * 0.3) - scene1Ocean.tilePosition.x) * animationBuffer;
		scene1OceanObjects.position.x += (((targetX - scene1WidthContainer) * 0.3) - scene1OceanObjects.position.x ) * animationBuffer;
		scene1StreetObjects.position.x += (((targetX - scene1WidthContainer) * 0.9) - scene1StreetObjects.position.x ) * animationBuffer;
		scene1Dominos.position.x += (((targetX - scene1WidthContainer) * 1) - scene1Dominos.position.x ) * animationBuffer;
		scene1Street.tilePosition.x += (targetX - scene1Street.tilePosition.x) * animationBuffer;
		scene1Trees.tilePosition.x += ((targetX * 1.5) - scene1Trees.tilePosition.x) * animationBuffer;
		scene1Sun.position.y = -5 + (100 * (tempPosition / -maskZone1On));
		scene1Glow.position.y = -5 + (100 * (tempPosition / -maskZone1On));
	}
	
	if (scene2Loaded) {
		/*
		if (scene2Active) {
			var tempTargetX = targetX + maskZone1On;
			var ovenFramesTotal = ovenMovieClipArray.length-1;
			var ovenFrameScenePercentage = scene2Width/6;
			var ovenFrame = Math.floor( ovenFramesTotal * (( tempTargetX / ovenFrameScenePercentage )) );
			if (ovenFrame >= ovenFramesTotal) ovenFrame = ovenFramesTotal;
			if (ovenFrame <= 0) ovenFrame = 0;
			//console.log(tempTargetX + " / " + ovenFramesTotal + " / " + ovenFrameScenePercentage + " / " + ovenFrame)
			scene2WarmingOven.gotoAndStop(ovenFrame);
		}
		*/

		triggerBetween(-maskZone1On,-maskZone1Off,
			function(){
				if (!useSound) return;
				app.media.playSound("day-bg", true);
				app.media.pauseSound("crickets");

			}, function(){

			});


		var tempTargetX = targetX + maskZone1On;
		scene2Car.position.x += (minSiteWidth/2 + (tempTargetX * 0.02) - scene2Car.position.x ) * animationBuffer;
		scene2Bg.tilePosition.x += ((tempTargetX * 0.05) - scene2Bg.tilePosition.x ) * animationBuffer;
	}

	if (scene3Loaded) {
		if (scene3Active) {
			spriteShip.play();
			spriteSailboat.play();
			spriteB777.play();
			spriteJogger.play();
			spriteWalking_waving.play();
			triggerBetween(maskZone1X,maskZone2On - windowFullWidth,
				function(){
					if (!useSound) return;
					app.media.playSound("day-bg", true);
					app.media.pauseSound("crickets");

				}, function(){

				}
			);

			scene3Timeline.play();
		} else {
			spriteShip.stop();
			spriteSailboat.stop();
			spriteB777.stop();
			spriteJogger.stop();
			spriteWalking_waving.stop();

			scene3Timeline.pause();
		}
		var scene = scenes[3];
		var tempTargetX = targetX + maskZone1X;
		updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections);
		scene3Clouds.position.x += (((tempTargetX - scene3WidthContainer) * 0.15) - scene3Clouds.position.x ) * animationBuffer;
		scene3City.position.x += (((tempTargetX - scene3WidthContainer) * 0.20) - scene3City.position.x ) * animationBuffer;
		scene3Ocean.tilePosition.x += ((tempTargetX * 0.3) - scene3Ocean.tilePosition.x) * animationBuffer;
		scene3OceanObjects.position.x += (((tempTargetX - scene3WidthContainer) * 0.3) - scene3OceanObjects.position.x ) * animationBuffer;
		scene3Buildings.position.x += (((tempTargetX - scene3WidthContainer) * 1) - scene3Buildings.position.x ) * animationBuffer;
		scene3Street.tilePosition.x += (tempTargetX - scene3Street.tilePosition.x) * animationBuffer;
		scene3Trees.tilePosition.x += ((tempTargetX * 1.5) - scene3Trees.tilePosition.x) * animationBuffer;
		scene3Sun.position.y = -5 + (100 * (tempPosition / -maskZone1On));
		scene3Glow.position.y = -5 + (100 * (tempPosition / -maskZone1On));
	}
	
	if (scene4Loaded) {
		// ANIMATION FOR ALL THE ITEMS IN THE CAR
		if (scene4Active) {
			scene4Timeline.tweenTo( scene4Timeline.duration() * currentScenePercentage );
			spriteTop_bird.play();
			triggerBetween(-maskZone2On,-maskZone2Off,
				function(){
					if (!useSound) return;
					console.log("PLAY SOUND 4")
					app.media.playSound("day-bg", true);
					app.media.pauseSound("crickets");

				}, function(){

				}
			);

			scene4BirdTimeline.play();
		} else {
			spriteTop_bird.stop();
			
			scene4BirdTimeline.pause();
		}
		scene4Extra.tilePosition.x += ( targetX - scene4Extra.tilePosition.x ) * animationBuffer;
		scene4Bg.tilePosition.x += (targetX - scene4Bg.tilePosition.x ) * animationBuffer;
		scene4SidewalkTop.tilePosition.x += (targetX - scene4SidewalkTop.tilePosition.x ) * animationBuffer;
		scene4SidewalkBottom.tilePosition.x += (targetX - scene4SidewalkBottom.tilePosition.x ) * animationBuffer;
	}
	
	if (scene5Loaded) {
		if (scene5Active) {

			var daySound = app.media.get("sounds").get("day-bg");
			var nightSound = app.media.get("sounds").get("crickets");

			triggerBetween(
				(-maskZone2X) + 1500, // coeresed to a positive number for comparison
				(-maskZone2X) + 2500, // coeresed to a positive number for comparison
				function(){
					spriteDonny.gotoAndPlay(0);
					if (!useSound) return;
					app.media.playSound("donny");
				},
				function(){
				}
			);
			spriteBiker.play();
			spriteBird1.play();
			spriteWalking_dog.play();
			spriteDrinking.play();

			triggerBetween(-maskZone2X,-(maskZone3On - windowFullWidth),
				function(){
					if (!useSound) return;
					console.log("PLAY SOUND 5")
					app.media.playSound("day-bg");
					app.media.playSound("crickets");

				}, function(){

				}
			);
			
			scene5Timeline.play();
		} else {
			spriteBiker.stop();
			spriteBird1.stop();
			spriteWalking_dog.stop();
			spriteDrinking.stop();
			
			scene5Timeline.pause();
		}

		var scene = scenes[5];

		// FADE EVERYTHING DEPENDING UPON WHERE YOU ARE AT IN THE SCENE             
		if (scene5Active && currentXPos < maskZone2X && currentXPos > maskZone3On) {
			var startFade = maskZone2X;
			var endFade = maskZone3On;
			var tempOpacity = ((currentXPos - startFade) / (endFade - startFade));
			
			scene5SkyExtraNight.alpha = tempOpacity;
			scene5SkyNight.alpha = tempOpacity;
			scene5SunNight.alpha = tempOpacity;
			scene5CityNight.alpha = tempOpacity;
			scene5OceanNight.alpha = tempOpacity;
			scene5BuildingsNight.alpha = tempOpacity;
			scene5TreesNight.alpha = tempOpacity;		
			scene5GlowDay.alpha = 1 - tempOpacity;	
			scene5GlowNight.alpha = tempOpacity;
			scene5StreetNight.alpha = tempOpacity;

			scene.car.nightCar.alpha = tempOpacity;

			// daySound.set("volume", daySound.originalVolume * (1 - tempOpacity));
			// nightSound.set("volume", nightSound.originalVolume * tempOpacity);
		}
			
		var tempTargetX = targetX + maskZone2X;
		
		updateCar([scene.car.dayCar.wheels.front, scene.car.dayCar.wheels.rear], scene.car.dayCar.reflections);
		updateCar([scene.car.nightCar.wheels.front, scene.car.nightCar.wheels.rear], scene.car.nightCar.reflections);

		scene5City.position.x += (((tempTargetX - scene5WidthContainer) * 0.20) - scene5City.position.x ) * animationBuffer;
		scene5OceanDay.tilePosition.x += ((tempTargetX * 0.3) - scene5OceanDay.tilePosition.x) * animationBuffer;
		scene5OceanNight.tilePosition.x += ((tempTargetX * 0.3) - scene5OceanNight.tilePosition.x) * animationBuffer;
		scene5Buildings.position.x += (((tempTargetX - scene5WidthContainer) * 1) - scene5Buildings.position.x ) * animationBuffer;
		scene5StreetDay.tilePosition.x += (tempTargetX - scene5StreetDay.tilePosition.x) * animationBuffer;
		scene5StreetNight.tilePosition.x += (tempTargetX - scene5StreetNight.tilePosition.x) * animationBuffer;
		scene5TreesDay.tilePosition.x += ((tempTargetX * 1.5) - scene5TreesDay.tilePosition.x) * animationBuffer;
		scene5TreesNight.tilePosition.x += ((tempTargetX * 1.5) - scene5TreesNight.tilePosition.x) * animationBuffer;
		scene5Donny.position.x += (((tempTargetX - scene5WidthContainer) * 1) - scene5Donny.position.x ) * animationBuffer;
		scene5Sun.position.y = -5 + (100 * (tempPosition / -maskZone1On));
		scene5GlowDay.position.y = -5 + (100 * (tempPosition / -maskZone1On));
	}
	
	if (scene6Loaded) {	
		if (scene6Active){
			triggerBetween(-maskZone3On,-maskZone3Off,
				function(){
					if (!useSound) return;
					console.log("PLAY SOUND 6")
					app.media.pauseSound("day-bg");
					app.media.playSound("crickets");

				}, function(){

				}
			);
		}


		scene6Bridge.tilePosition.x += ((targetX * 0.35) - scene6Bridge.tilePosition.x ) * animationBuffer;
		scene6Ocean.tilePosition.x += ((targetX * 0.5) - scene6Ocean.tilePosition.x ) * animationBuffer;
		scene6City.tilePosition.x += ((targetX * 1) - scene6City.tilePosition.x ) * animationBuffer;
	}

	if (scene7Loaded) {
		// DXP BUBBLE SHOW/HIDE
		if (scene7Active){
			triggerBetween(
				(-maskZone3X) + 1500, // coeresed to a positive number for comparison
				(-maskZone3X) + 2500, // coeresed to a positive number for comparison
				function(){
					TweenMax.to( scene7DxpBubble, 0.5, { alpha: 1, ease: Linear.easeNone });
					TweenMax.fromTo( scene7DxpFlash, 1, {alpha: 1}, {alpha: 0});
					if (!useSound) return;
					app.media.playSound("camera");
				},
				function(){
					TweenMax.to( scene7DxpBubble, 0.5, { alpha: 0, ease: Linear.easeNone });
				}
			);

			triggerBetween(-maskZone3X,-(maskZone4On - windowFullWidth),
				function(){
					if (!useSound) return;
					console.log("PLAY SOUND 7")
					app.media.pauseSound("day-bg");
					app.media.pauseSound("rain");
					app.media.playSound("crickets");

				}, function(){

				}
			);

			spriteSpeedboat.play();
			spriteTraffic_light.play();
			spriteWalking.play();
			//spriteNewspapers.play();
			spriteOld_car.play();
			
			scene7Timeline.play();
		} else {
			spriteSpeedboat.stop();
			spriteTraffic_light.stop();
			spriteWalking.stop();
			//spriteNewspapers.stop();
			spriteOld_car.stop();
			
			scene7Timeline.pause();
		}

		var scene = scenes[7];
		updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections);
		

		var tempTargetX = targetX + maskZone3X;
		scene7Clouds.position.x += (((tempTargetX - scene7WidthContainer) * 0.15) - scene7Clouds.position.x ) * animationBuffer;
		scene7City.position.x += (((tempTargetX - scene7WidthContainer) * 0.20) - scene7City.position.x ) * animationBuffer;
		scene7Ocean.tilePosition.x += ((tempTargetX * 0.3) - scene7Ocean.tilePosition.x) * animationBuffer;
		scene7OceanObjects.position.x += (((tempTargetX - scene7WidthContainer) * 0.3) - scene7OceanObjects.position.x ) * animationBuffer;
		scene7Buildings.position.x += (((tempTargetX - scene7WidthContainer) * 1) - scene7Buildings.position.x ) * animationBuffer;
		scene7Street.tilePosition.x += (tempTargetX - scene7Street.tilePosition.x) * animationBuffer;
		scene7Trees.tilePosition.x += ((tempTargetX * 1.5) - scene7Trees.tilePosition.x) * animationBuffer;
	}
	
	if (scene8Loaded) {
		triggerBetween(-maskZone4On,-maskZone4Off,
			function(){
				if (!useSound) return;
				console.log("PLAY SOUND 8")
				app.media.pauseSound("day-bg");
				app.media.pauseSound("rain");
				app.media.playSound("crickets");

			}, function(){

			}
		);

		var tempTargetX = targetX + maskZone4On;
		scene8Location.position.x += (((tempTargetX - scene8Width) + 40) - scene8Location.position.x ) * animationBuffer;
		if (scene8Location.position.x >= 40) scene8Location.position.x = 40;
		scene8Bg.tilePosition.x += ( targetX - scene8Bg.tilePosition.x ) * animationBuffer;
		scene8Icons.tilePosition.x += ( targetX - scene8Icons.tilePosition.x ) * animationBuffer;
		scene8Dots.tilePosition.x += ( targetX - scene8Dots.tilePosition.x ) * animationBuffer;
	}

	if (scene9Loaded) {
		var scene = scenes[9];
		if (scene9Active) {
			triggerBetween(
				(-maskZone4X) + 2000, // coeresed to a positive number for comparison
				(-maskZone4X) + 3000, // coeresed to a positive number for comparison
				function(){
					if (scene9UfoInTimeline.time() === 0 || scene9UfoInTimeline.time() === scene9UfoInTimeline.duration()) {
						scene9UfoInTimeline.play(0);
					}
				},
				function(){
				}
			);
			triggerBetween(
				(-maskZone4X) + 100, // coeresed to a positive number for comparison
				(-maskZone4X) + 1000, // coeresed to a positive number for comparison
				function(){
					spriteNoid.gotoAndPlay(0);
					if (!useSound) return;
					app.media.playSound("noid");
				},
				function(){
				}
			);

			triggerBetween(-maskZone4X,-(maskZone5On - windowFullWidth),
				function(){
					if (!useSound) return;
					app.media.pauseSound("day-bg");
					app.media.playSound("rain");
					app.media.playSound("crickets");

				}, function(){

				}
			);
			scene.rain.play();
			
			scene9Timeline.play();
		} else {
			scene.rain.stop();
			
			scene9Timeline.stop();
		}
		var tempTargetX = targetX + maskZone4X;
		var scene9Max = scene9WidthContainer //- 500;
		
		if (tempTargetX > scene9Max) {
			tempTargetX  = scene9Max;
			// WHEEL HACK
			currentTireRotation += ((tempTargetX * 0.01) - currentTireRotation ) * animationBuffer;
			updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections, currentTireRotation);
		} else {
			updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections);
		}	
		scene9Clouds.position.x += (((tempTargetX - scene9WidthContainer) * 0.15) - scene9Clouds.position.x ) * animationBuffer;
		scene9City.position.x += (((tempTargetX - scene9WidthContainer) * 0.20) - scene9City.position.x ) * animationBuffer;
		scene9Ocean.tilePosition.x += ((tempTargetX * 0.3) - scene9Ocean.tilePosition.x) * animationBuffer;
		scene9OceanObjects.position.x += (((tempTargetX - scene9WidthContainer) * 0.3) - scene9OceanObjects.position.x ) * animationBuffer;
		scene9Buildings.position.x += (((tempTargetX - scene9WidthContainer) * 1) - scene9Buildings.position.x ) * animationBuffer;
		scene9Street.tilePosition.x += (tempTargetX - scene9Street.tilePosition.x) * animationBuffer;
	}
	
	if (scene10Loaded) {
		if (scene10Active) {
			spritepuddle1.play();
			spritepuddle2.play();
			spritepuddle3.play();

			triggerBetween(-maskZone5On,-maskZone5Off,
				function(){
					if (!useSound) return;
					console.log("PLAY SOUND 10")
					app.media.pauseSound("day-bg");
					app.media.playSound("rain", true);
					app.media.playSound("crickets");

				}, function(){

				}
			);
		} else {
			spritepuddle1.stop();
			spritepuddle2.stop();
			spritepuddle3.stop();
		}
		var tempTargetX = targetX + maskZone5On;
		scene10Puddles.position.x += (minSiteWidth/2 + (tempTargetX * 0.05) - scene10Puddles.position.x ) * animationBuffer;
		scene10Car.position.x += (minSiteWidth/2 + (tempTargetX * 0.02) - scene10Car.position.x ) * animationBuffer;
		scene10CarLight.position.x += (minSiteWidth/2 + (tempTargetX * 0.02) - scene10CarLight.position.x ) * animationBuffer;
		scene10Bg.tilePosition.x += ((targetX * 0.05) - scene10Bg.tilePosition.x ) * animationBuffer;
	}

	if (scene11Loaded) {
		if (scene11Active) {

			triggerBetween(-maskZone5X,maxTargetX,
				function(){
					if (!useSound) return;
					app.media.pauseSound("day-bg");
					app.media.pauseSound("rain", true);
					app.media.playSound("crickets");

				}, function(){

				}
			);

			triggerBetween(
				(-maskZone5X) + 1500, // coeresed to a positive number for comparison
				(-maskZone5X) + 2500, // coeresed to a positive number for comparison
				function(){
					spriteShooting_star.gotoAndPlay(0);
				},
				function(){
				}
			);
			triggerWhenCrossing((-maskZone5X) + 500, function(){
				if (!useSound) return;
				app.media.playSound("redoctober");
			});
			spriteVictory_dance.play();
			//spriteRed_October.play();
			
			scene11Timeline.play();
		} else {
			spriteVictory_dance.stop();
			//spriteRed_October.stop();
			
			scene11Timeline.pause();
		}

		var scene = scenes[11];
		
		var tempTargetX = targetX + maskZone5X;
		var deadZone = 1000;
		if (tempTargetX < deadZone) {
			tempTargetX = 0;
		} else {
			tempTargetX = tempTargetX - deadZone;
			updateCar([scene.car.wheels.front, scene.car.wheels.rear], scene.car.reflections);
		}
		scene11Clouds.position.x += (((tempTargetX - scene11WidthContainer) * 0.15) - scene11Clouds.position.x ) * animationBuffer;
		scene11City.position.x += (((tempTargetX - scene11WidthContainer) * 0.20) - scene11City.position.x ) * animationBuffer;
		scene11Ocean.tilePosition.x += ((tempTargetX * 0.3) - scene11Ocean.tilePosition.x) * animationBuffer;
		scene11OceanObjects.position.x += (((tempTargetX - scene11WidthContainer) * 0.3) - scene11OceanObjects.position.x ) * animationBuffer;
		scene11Buildings.position.x += (((tempTargetX - scene11WidthContainer) * 1) - scene11Buildings.position.x ) * animationBuffer;
		scene11Street.tilePosition.x += (tempTargetX - scene11Street.tilePosition.x) * animationBuffer;
		scene11Trees.tilePosition.x += ((tempTargetX * 1.5) - scene11Trees.tilePosition.x) * animationBuffer;
	}

	function updateCar(wheels, reflections, rotation){
		var wheelRotation = currentXPos;
		if (rotation) wheelRotation = rotation;

		if (!_.isArray(wheels)) wheels = [wheels];

		_.each(wheels, function(wheel){
			wheel.gotoAndStop(Math.abs(Math.round((wheelRotation * 0.17) % wheel.totalFrames)));
		});
		
		reflections.gotoAndStop(Math.abs(Math.round((wheelRotation * 0.04) % reflections.totalFrames)));
	}
}

function updateProgress() {
	var tempSceneId;
	var prescaleWindowWidth = windowFullWidth / ratioPercentage;
	var START_POSITIONS = [
		0,
		prescaleWindowWidth,
		-maskZone1On , // coereced to positive values for comparison
		-maskZone1Off,
		-maskZone2On ,
		-maskZone2Off,
		-maskZone3On ,
		-maskZone3Off,
		-maskZone4On ,
		-maskZone4Off,
		-maskZone5On ,
		-maskZone5Off,
		maxTargetX
	];

	var _sceneId = -1;

	for (var i = 0, endi = START_POSITIONS.length - 1; i<endi; i++){
		if (isBetween(currentX, START_POSITIONS[i], START_POSITIONS[i+1])){
			_sceneId = i;
			continue;
		}
	}

	var _sceneStart = START_POSITIONS[_sceneId];
	var _sceneEnd = START_POSITIONS[_sceneId + 1];

	var csp = (currentX - _sceneStart) / (_sceneEnd - _sceneStart);

	// temporary bridge
	tempSceneId = _sceneId;
	currentScenePercentage = csp;
	//end bridge

	if (tempSceneId != currentSceneId) {
		currentSceneId = tempSceneId;
		triggerSceneStart(currentSceneId);
	} 
	 
	if (currentScenePercentage < 0.01) currentScenePercentage = 0;
	if (currentScenePercentage > 0.99) currentScenePercentage = 1;
	triggerSceneStatus(currentSceneId, currentScenePercentage);
	
	scenes[0].active = scene0Active   = isBetween(currentXPos, 1, -windowFullWidth);
	scenes[1].active = scene1Active   = isBetween(currentXPos, 0, maskZone1On - windowFullWidth);
	scenes[2].active = scene2Active   = isBetween(currentXPos, maskZone1On, maskZone1Off);
	scenes[3].active = scene3Active   = isBetween(currentXPos, maskZone1X, maskZone2On - windowFullWidth);
	scenes[4].active = scene4Active   = isBetween(currentXPos, maskZone2On, maskZone2Off);
	scenes[5].active = scene5Active   = isBetween(currentXPos, maskZone2X, maskZone3On - windowFullWidth);
	scenes[6].active = scene6Active   = isBetween(currentXPos, maskZone3On, maskZone3Off);
	scenes[7].active = scene7Active   = isBetween(currentXPos, maskZone3X, maskZone4On - windowFullWidth);
	scenes[8].active = scene8Active   = isBetween(currentXPos, maskZone4On, maskZone4Off);
	scenes[9].active = scene9Active   = isBetween(currentXPos, maskZone4X, maskZone5On - windowFullWidth);
	scenes[10].active = scene10Active = isBetween(currentXPos, maskZone5On, maskZone5Off);
	scenes[11].active = scene11Active = isBetween(currentXPos, maskZone5X, -maxTargetX);
}

var $vignette;
var $vignette_top;
var $vignette_bottom;
function updateText() {
	var allowAnimations = false;
	if (inTransition === true) return;
	triggerBetween(
		0, 
		500,
		function(){
			TweenMax.to( scene0Car, 1, { x: (minSiteWidth/2), ease: Power4.easeOut }, 0);
			TweenMax.to( scene0Group, 1, { x: 0, ease: Power4.easeOut, overwrite: true, onStart: function() {
				showGroup(scene0Group);
			}, onComplete: function() {
				hideGroup(scene1Group);
			}});
		},
		function(){
		}
	);

	triggerBetween(
		500, // coeresed to a positive number for comparison
		-maskZone1On, // coeresed to a positive number for comparison
		function(){
			TweenMax.to( scene0Car, 1, { x: (minSiteWidth/2 + 500), ease: Power4.easeOut }, 0);
			TweenMax.to( scene0Group, 1, { x: windowFullWidthDifference, ease: Power4.easeOut, overwrite: true, onStart: function() {
				showGroup(scene1Group);
			}, onComplete: function() {
				hideGroup(scene0Group);
				showGroup(scene2Group);
			}});
			$vignette.addClass('active');
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.staggerFromTo(_.shuffle($(".text1 h1 .at-letter")), 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, ease: Circ.easeOut, overwrite: true}, 0.025);
			}
			$(".text1").addClass("active");
		},
		function(){
			$vignette.removeClass('active');
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text1 h1 .at-letter", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text1").removeClass("active");
					}
				});
			} else {
				$(".text1").removeClass("active");
			}
		}
	);

	triggerBetween(
		-maskZone1On, // coeresed to a positive number for comparison
		-maskZone1X, // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text2 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text2 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text2").addClass("active");
			$vignette.addClass('active');
			$vignette_top.addClass('active');
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text2 h1 .at-letter, .text2 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text2").removeClass("active");
					}
				});
			} else {
				$(".text2").removeClass("active");
			}
			$vignette.removeClass('active');
			$vignette_top.removeClass('active');
		}
	);

	triggerBetween(
		-(maskZone2X + scene4Width/2), // coeresed to a positive number for comparison
		-maskZone2X, // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text3 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text3 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text3").addClass("active");
			$vignette.addClass('active');
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text3 h1 .at-letter, .text3 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text3").removeClass("active");
					}
				});
			} else {
				$(".text3").removeClass("active");
			}
			$vignette.removeClass('active');
		}
	);

	triggerBetween(
		-maskZone3On, // coeresed to a positive number for comparison
		-(maskZone3X + scene6Width/2), // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text4 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text4 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
				TweenMax.to( scene6Car, 3, { y: 1200, scaleX: .60, scaleY: .60, ease: Expo.easeOut });
			} else {
				TweenMax.to( scene6Car, 3, { y: 1200, scaleX: .75, scaleY: .75, ease: Expo.easeOut });
			}

			$(".text4").addClass("active");
			$vignette.addClass('active');
			if ($html.hasClass("touch")) $vignette_top.addClass('active');
			TweenMax.to( scene6Bg, 3, { y: 1080, ease: Expo.easeOut });
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text4 h1 .at-letter, .text4 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text4").removeClass("active");
					}
				});
			} else {
				$(".text4").removeClass("active");
			}
			$vignette.removeClass('active');
			if ($html.hasClass("touch")) $vignette_top.removeClass('active');
		}
	);

	triggerBetween(
		-(maskZone3On - scene6Width/2), // coeresed to a positive number for comparison
		-maskZone3Off, // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text5 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text5 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text5").addClass("active");
			$vignette.addClass('active');
			
			TweenMax.to( scene6Car, 3, { y: 1080, scaleX: 1, scaleY: 1, ease: Expo.easeOut });
			TweenMax.to( scene6Bg, 3, { y: 900, ease: Expo.easeOut });
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text5 h1 .at-letter, .text5 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text5").removeClass("active");
					}
				});
			} else {
				$(".text5").removeClass("active");
			}
			$vignette.removeClass('active');
		}
	);

	triggerBetween(
		-maskZone3X, // coeresed to a positive number for comparison
		-(maskZone4X + scene8Width + 5000), // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text6 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text6 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text6").addClass("active");
			$vignette.addClass('active');
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text6 h1 .at-letter, .text6 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text6").removeClass("active");
					}
				});
			} else {
				$(".text6").removeClass("active");
			}
			$vignette.removeClass('active');
		}
	);

	triggerBetween(
		-maskZone4On, // coeresed to a positive number for comparison
		-maskZone4X, // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text7 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text7 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text7").addClass("active");
			$vignette.addClass('active');
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text7 h1 .at-letter, .text7 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text7").removeClass("active");
					}
				});
			} else {
				$(".text7").removeClass("active");
			}
			$vignette.removeClass('active');
		}
	);

	triggerBetween(
		-maskZone5On, // coeresed to a positive number for comparison
		-maskZone5X, // coeresed to a positive number for comparison
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text8 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text8 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text8").addClass("active");
			$vignette.addClass('active');
			if ($html.hasClass("touch")) $vignette_bottom.addClass('active');
			
			TweenMax.to( scene10CarLight, 0.5, { alpha: .9, ease: Linear.easeNone, delay: 1 });
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text8 h1 .at-letter, .text8 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text8").removeClass("active");
					}
				});
			} else {
				$(".text8").removeClass("active");
			}
			$vignette.removeClass('active');
			if ($html.hasClass("touch")) $vignette_bottom.removeClass('active');
			
			TweenMax.to( scene10CarLight, 0.5, { alpha: 0, ease: Linear.easeNone });
		}
	);

	triggerBetween(
		-(maskZone5X - 2000), // coeresed to a positive number for comparison
		maxTargetX, 
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				var $letters = _.shuffle($(".text9 h1 .at-letter"));
				TweenMax.staggerFromTo($letters, 0.35, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);

				var $words = $(".text9 h3 .at-word");
				var $words1 = _.shuffle($words);
				TweenMax.staggerFromTo($words1, 0.5, {autoAlpha: 0, x:-100}, {autoAlpha: 1, x:0, overwrite: true, ease: Circ.easeOut}, 0.025);
			}
			$(".text9").addClass("active");
			$vignette.addClass('active');
		},
		function(){
			if ($html.hasClass("no-touch") && allowAnimations){
				TweenMax.to(".text9 h1 .at-letter, .text9 h3 .at-word", 0.5, {autoAlpha: 0, overwrite: true,
					onComplete: function (){
						$(".text9").removeClass("active");
					}
				});
			} else {
				$(".text9").removeClass("active");
			}
			$vignette.removeClass('active');
		}
	);
}

// MOUSE / TOUCH / WHEEL / KEY / RESIZE
function onResize(){
	windowFullWidth = window.innerWidth;
	windowFullHeight = window.innerHeight;
	windowHalfWidth = windowFullWidth / 2;
	windowHalfHeight = windowFullHeight / 2;
	
	ratioSiteWidth = Math.min(windowFullWidth, 1180);
	ratioSiteHeight = Math.min(windowFullHeight, 1080);
	
	// ONLY GET RATIO FROM WIDTH
	ratioPercentage = Math.min((ratioSiteWidth/1180));
	ratioPercentageHeight = Math.min((ratioSiteHeight/1080));
	
	minSiteWidth = Math.max(windowFullWidth, 1180);
	minSiteHeight = Math.max(windowFullHeight, 1080);
	
	renderer.resize( windowFullWidth, windowFullHeight );
	vizGroup.width = minSiteWidth;
	vizGroup.position.y = windowFullHeight;
	vizGroup.scale.x = vizGroup.scale.y = ratioPercentage;
	
	vizGroupCenter.width = minSiteWidth;
	vizGroupCenter.position.y = windowHalfHeight;
	vizGroupCenter.scale.x = vizGroupCenter.scale.y = ratioPercentage;
	
	coverupGroup.width = minSiteWidth;
	coverupGroup.position.y = windowFullHeight;
	coverupGroup.scale.x = coverupGroup.scale.y = ratioPercentage;
	
	redrawMasks();
	
	windowFullWidthDifference = windowFullWidth * (windowFullWidth / (windowFullWidth * ratioPercentage));
	windowFullHeightDifference = windowFullHeight * (windowFullHeight / (windowFullHeight * ratioPercentage));
	var upscalePercentageX = Math.max((Math.max(windowFullWidth, 1920)/1920));
	var upscalePercentageY = Math.max((Math.max(windowFullHeight, 1080)/1080));
	var rainRatio = Math.max(upscalePercentageX, upscalePercentageY);
	var upscaleBackgroundY = Math.max((Math.max(windowFullHeightDifference, 1080)/1080));
	
	if (scene0Loaded) {
		scene0Car.position.x = minSiteWidth/2;
		scene0Swipe.position.x = minSiteWidth/2;
		scene0Water.tilePosition.x = minSiteWidth/2;
		scene0CoverRight.position.x = windowFullWidth - 250;
		// POSITION THE RIGHT LAND MASS
		if (ratioPercentage < 1) {
			scene0CoverRight.position.x = windowFullWidthDifference - 275;
		}
		var scene0ScaleFactor = Math.min((Math.min(windowFullHeight, 800)/800));
		if ($html.hasClass("touch")) scene0ScaleFactor = .70;
		scene0Car.scale.x = scene0Car.scale.y = scene0ScaleFactor;
	}
	
	if (scene1Loaded) scenes[1].car.position.x = minSiteWidth/2;
	if (scene2Loaded) {
		scene2Car.position.x = minSiteWidth/2;
		scene2Bg.scale.x = scene2Bg.scale.y = upscaleBackgroundY;
	}
	if (scene3Loaded) scenes[3].car.position.x = minSiteWidth/2;
	if (scene4Loaded) {
		scene4SidewalkTop.position.y = -((minSiteHeight - 1080) / 2);
		scene4SidewalkBottom.position.y = 1080 + ((minSiteHeight - 1080) / 2);
		scene4Car.position.x = minSiteWidth/2;
	}
	if (scene5Loaded) {
		scenes[5].car.position.x = minSiteWidth/2;
		scene5GlowNight.position.x = minSiteWidth/2;
	}
	if (scene6Loaded) {
		scene6Car.position.x = minSiteWidth/2;
		scene6Glow.position.x = minSiteWidth/2;
		scene6Bg.scale.x = scene6Bg.scale.y = upscaleBackgroundY;
	}
	if (scene7Loaded) {
		scenes[7].car.position.x = minSiteWidth/2;
		scene7Glow.position.x = minSiteWidth/2;
	}
	if (scene8Loaded) {
		scene8Car.position.x = minSiteWidth/2;
		scene8Dots.width = minSiteWidth/2;
	}
	if (scene9Loaded) {
		scenes[9].car.position.x = minSiteWidth/2;
		scene9Glow.position.x = minSiteWidth/2;
		// scenes[9].rain.scale.x = scenes[9].rain.scale.y = assetRatio * 2;
		// scenes[9].rain.position.x = minSiteWidth / 2;
		// scenes[9].rain.position.y = minSiteHeight;
	}
	if (scene10Loaded) {
		scene10Puddles.position.x = minSiteWidth/2;
		scene10Puddles.position.y = -((minSiteHeight - 1080) / 2);
		scene10Car.position.x = minSiteWidth/2;
		scene10Car.position.y = -((minSiteHeight - 1080) / 2);
		scene10CarLight.position.x = minSiteWidth/2;
		scene10CarLight.position.y = -((minSiteHeight - 1080) / 2);
		scene10Glow.position.x = minSiteWidth/2;
		scene10Glow.position.y = -((minSiteHeight - 1080) / 2);
	}
	if (scene11Loaded) {
		scenes[11].car.position.x = minSiteWidth/2;
		scene11Glow.position.x = minSiteWidth/2;
	}
	if (safeAreaMarker){
		safeAreaMarker.position.x = minSiteWidth/2;
		safeAreaMarker.position.y = minSiteHeight;
	}
}

function checkParallaxBoundaries() {
	if (targetX <= minTargetX) targetX = minTargetX;
	if (targetX >= maxTargetX) targetX = maxTargetX;
}


// Triggers -------------------------------------------

function triggerBetween(start, end, onEntered, onLeft){
	onEntered = onEntered || _.noop;
	onLeft = onLeft || _.noop;
	if (hasEnteredRange(tempPosition, prevPosition, start, end)){
		onEntered();
	} else if (hasLeftRange(tempPosition, prevPosition, start, end) || hasHoppedTheRange(tempPosition, prevPosition, start, end)){
		onLeft();
	}
}

function isBetween(x, start, end){
	if (end < start){
		var t = start;
		start = end;
		end = t;
	}
	return x >= start && x < end;
}
	
function hasEnteredRange(x, px, start, end){ 
	// if it is now between and was not between
	return isBetween(x, start, end) && !isBetween(px, start, end);
}

function hasLeftRange(x, px, start, end){
	// if it was between and is now not between
	return isBetween(px, start, end) && !isBetween(x, start, end);
}

function hasHoppedTheRange(x, px, start, end){
	// if px is below the range and x is above the range
	// or
	// if px is above the range and x is below the range
	return (px < start && x >= end) || (px >= end && x < start);
}

function triggerWhenCrossing(target, onCrossing){
	var x = tempPosition;
	var px = prevPosition;
	if ((x >= target && px < target) || (x <= target && px > target)){
		onCrossing();
		return true;
	}
	return false;
}

function triggerWhenCrossingForward(target, onCrossing){
	var x = tempPosition;
	var px = prevPosition;
	if (x >= target && px < target){
		onCrossing();
		return true;
	}
	return false;
}

function triggerWhenCrossingReverse(target, onCrossing){
	var x = tempPosition;
	var px = prevPosition;
	if (x <= target && px > target){
		onCrossing();
		return true;
	}
	return false;
}

// UI Event Handlers -------------------------------------------


function onDocumentMouseDown( event ) {
	isMouseDown = true;
	event.preventDefault();
	view.$el.on( 'mousemove', onDocumentMouseMove );
	view.$el.on( 'mouseup', onDocumentMouseUp );
	view.$el.on( 'mouseout', onDocumentMouseOut );
	mouseXOnMouseDown = event.clientX - windowHalfWidth;
	targetXOnMouseDown = targetX;
}

function onDocumentMouseMove( event ) {
	mouseX = event.clientX - windowHalfWidth;
	var mouseMovement = ( mouseX - mouseXOnMouseDown );
	targetX = targetXOnMouseDown + mouseMovement;
	if (ratioPercentage < 1) {		
		var scaleMultiplier = ((1 - ratioPercentage)*2);
		targetX = targetXOnMouseDown + ( mouseMovement + ( mouseMovement * scaleMultiplier ));
	}
	checkParallaxBoundaries();
}

function onDocumentMouseUp( event ) {
	isMouseDown = false;
	view.$el.off( 'mousemove', onDocumentMouseMove );
	view.$el.off( 'mouseup', onDocumentMouseUp );
	view.$el.off( 'mouseout', onDocumentMouseOut );
}

function onDocumentMouseOut( event ) {
	isMouseDown = false;
	view.$el.off( 'mousemove', onDocumentMouseMove );
	view.$el.off( 'mouseup', onDocumentMouseUp );
	view.$el.off( 'mouseout', onDocumentMouseOut );
}

// TOUCH
function onDocumentTouchStart( event ) {
	isMouseDown = true;
	event = event.originalEvent;
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfWidth;
		targetXOnMouseDown = targetX;
	}
}

function onDocumentTouchMove( event ) {
	event = event.originalEvent;
	if (inTransition === true) return;	
	
	animationBufferUpdate("normal");
	
	if ( event.touches.length === 1 ) {
		event.preventDefault();
		mouseX = event.touches[ 0 ].pageX - windowHalfWidth;
		var mouseMovement = ( mouseX - mouseXOnMouseDown );
		targetX = targetXOnMouseDown + mouseMovement;
		if (ratioPercentage < 1) {
			var scaleMultiplier = ((1 - ratioPercentage)*2)
			targetX = targetXOnMouseDown + ( mouseMovement + ( mouseMovement * scaleMultiplier ));
		}
		checkParallaxBoundaries();
	}
}

function onDocumentTouchEnd( event ) {
	isMouseDown = false;
}

function onDocumentKeyDown( event ) {
	if (inTransition === true) return;
	
	animationBufferUpdate("normal");
		
	var keyCode = event.keyCode || event.which, arrow = {left: 37, up: 38, right: 39, down: 40 };
	var moveOffset = window.innerWidth/2;
	
	switch (keyCode) {
		case arrow.left:
			targetX = targetX + moveOffset;
			break;
		case arrow.right:
			targetX = targetX - moveOffset;
			break;
		case arrow.up:
			targetX = targetX - moveOffset;
			break;
		case arrow.down:
			targetX = targetX + moveOffset;
			break;
	}
	checkParallaxBoundaries();
}

function onDocumentMouseWheel( event ) {
	// event.preventDefault();
	if (inTransition === true) return;	
	
	animationBufferUpdate("normal");
	
	var deltaY = -Math.min(Math.max(-120, event.deltaY), 120);
	var deltaX = Math.min(Math.max(-120, event.deltaX), 120);

	var acceleration = Math.sqrt((deltaX*deltaX)+(deltaY*deltaY));
	var angle = Math.atan2(deltaY, deltaX);
	var directionX = (Math.abs(angle < Math.PI * 0.5)) ? 1 : -1;
	acceleration *= directionX;

	// speed += acceleration;

	targetX -= (deltaY + deltaX);
	

	checkParallaxBoundaries();
}

// SET SOME NEW DEFINITIONS FOR PIXI TO USE
Object.defineProperty(PIXI.DisplayObject.prototype, 'scaleX', {
	get: function() {
		return  this.scale.x;
	},
		set: function(value) {
		this.scale.x = value;
	}
});

Object.defineProperty(PIXI.DisplayObject.prototype, 'scaleY', {
	get: function() {
		return  this.scale.y;
	},
		set: function(value) {
		this.scale.y = value;
	}
});

function numberFormat (number, width) {
    return new Array(+width + 1 - (number + '').length).join('0') + number;
}

module.exports = Page;