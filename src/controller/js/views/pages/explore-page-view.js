require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");
var FrameSequencerModel = require("../../components/FrameSequencer/framesequencer-model");
var FrameSequencerView = require("../../components/FrameSequencer/framesequencer-view");
var Analytics = require("../../services/AnalyticsService").init();


//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:-1,
	keep:true,
	el: "#explore-page",
	events: {
	},
	initialize: function(){
		var _this = this;

		AbstractPage.prototype.initialize.call(this);
		this.on("transitionInComplete", this.transitionInComplete, this);
		this.on("transitionOutComplete", this.transitionOutComplete, this);

		$(window).on("resize", _.bind(this.onResize, this));

		this.model = this.frameSequencerModel = new FrameSequencerModel({
			numImages: 71,
			cdn: window.cdn
		});
		this.model.on("change:loadProgress", function(obj, val){
			this.trigger("loadProgress", {
				progress: val,
				type: "section"
			});
		}, this);

		this.loadPromise = $.Deferred();

		this.frameSequencerView = new FrameSequencerView({
			model: this.frameSequencerModel,
			id: "car-spin-container"
		});


		this.frameSequencerView.model.on("progress", function(progress){
			this.app.trigger("progress", {
				"sceneId": 12,
				"progress": 1-progress
			});
			this.onProgress(progress);
		}.bind(this));
		this.onKeyPress = _.bind(onKeyPress, this);
	},
	navigateForward: function(){
			this.app.router.navigate("#locations/enter-zip", {trigger:true});
	},
	navigateBack: function(){
			this.app.router.navigate("#", {trigger:true});
	},
	setApp: function(app){
		this.app = app;
	},
	onProgress: function(p){
		this.frameSequencerView.off("sequenceComplete:end", this.navigateBack);
		this.frameSequencerView.off("sequenceComplete:start", this.navigateForward);
		this.$("section,.vignette").removeClass("active");

		if (p >= 0.75 && p < 1){
			this.$("section.title,.vignette").addClass("active");

			Analytics.trackEvent({
                event: "sectionView",
                "section": "360-title"
            });

		} else if (p >= 0.65 && p < 0.75){
			this.$("section.details,.vignette").addClass("active");
			Analytics.trackEvent({
                event: "sectionView",
                "section": "360-details"
            });

		} else if (p >= 0.35 && p < 0.65){
			this.$("section.markings,.vignette").addClass("active");
			Analytics.trackEvent({
                event: "sectionView",
                "section": "360-markings"
            });

		} else if (p >= 0.2 && p < 0.35){
			this.$("section.capacity,.vignette").addClass("active");
			Analytics.trackEvent({
                event: "sectionView",
                "section": "360-capacity"
            });

		} else if (p >= 0 && p < 0.2){
			this.$("section.map,.vignette").addClass("active");
			Analytics.trackEvent({
                event: "sectionView",
                "section": "360-continue"
            });
		}
	},

	// RENDERING

	beforeRender: function(){
		this.setViews({
			"#car-spin": this.frameSequencerView
		});
	},
	afterRender: function(){
		this.onResize();
		this.$("section.title");

	},
	loadAssets: function(){
		var _this = this;
		this.frameSequencerModel.set({
			// marking active triggers the load
			"active": true,
			"currentFrame": 0
		});
		this.model.get("loadPromise")
			.then(function(){
				_this.loadPromise.resolve();
			});
	},

	// EVENT HANDLERS
	onResize: function(){
		var w = this.$el.width(),
			h = this.$el.height(),
			aspect = w/h,
			spinHeight,
			spinWidth,
			spinX,
			spinY,
			spinScale = 0.8;

		// CONTAIN
		if (aspect < 16/9){
			// it's too tall
			// fit to height
			spinWidth = spinScale * w;
			spinHeight = spinScale * w * 9 / 16;
			spinX = (w * 0.5) - (spinWidth * 0.5);
			spinY = (h * 0.5) - (spinHeight * 0.5);
			//console.log("it's too tall",spinX);
		} else {

			// it's too wide
			// fit to width
			spinHeight = spinScale * h;
			spinWidth = spinScale * h * 16 / 9;
			spinX = (w * 0.5) - (spinWidth * 0.5);
			//console.log(spinX);
			spinY = (h * 0.5) - (spinHeight * 0.5);
			//console.log("it's too wide",spinX);
		}

		/*
		// COVER
		if (aspect > 16/9){
			//it's too tall
			// fit to width
			spinWidth = w;
			spinHeight = w * 9 / 16;
			spinX = 0;
			spinY = (h * 0.5) - (spinHeight * 0.5);
		} else {
			//it's too wide
			// fit to height
			spinHeight = h;
			spinWidth = h * 16 / 9;
			spinX = (w * 0.5) - (spinWidth * 0.5);
			spinY = 0;
		}
		*/
		this.frameSequencerView.$el.css({
			width: spinWidth,
			height: spinHeight,
			left: spinX,
		});
	},
	startPositions: [-100,0],

	// TRANSITIONS
	transitionIn: function(){
		this.startPositions = AbstractPage.prototype.transitionIn.apply(this, arguments);
	},
	transitionInComplete: function(){
		$(document).on("keydown", this.onKeyPress);

		var _this = this;

		this.frameSequencerView.on("sequenceComplete:end", _.debounce(function(){
			// 500ms after the last sequence end event
			// make the next sequence end event trigger a scene change
			console.log("sequenceComplete:end");
			_this.frameSequencerView.once("sequenceComplete:end", function(){
				console.log("sequenceComplete:end one time");
				this.navigateBack();
			}, _this);
		}), 500);
		this.frameSequencerView.on("sequenceComplete:start", _.debounce(function(){
			// 500ms after the last sequence end event
			// make the next sequence end event trigger a scene change
			console.log("sequenceComplete:start");
			
			_this.frameSequencerView.once("sequenceComplete:start", function(){
				console.log("sequenceComplete:start one time");
				this.navigateForward();
			}, _this);
		}), 500);
		this.frameSequencerView.activate(this.startPositions[0] >= 0 ? 0.001 : 0.999, true);
	},
	transitionOut: function(){
		this.frameSequencerModel.set("active", false);
		this.frameSequencerView.deactivate();
		this.frameSequencerView.off("sequenceComplete:start");
		this.frameSequencerView.off("sequenceComplete:end");
		$(document).off("keydown", this.onKeyPress);
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	transitionOutComplete: function(){

	},
	onKeyPress: onKeyPress
});

//----------------------------------------------

function onKeyPress(e){
	// e.stopImmediatePropagation();
	console.log(e);
	switch(e.keyCode){
		case (39): //right
			e.preventDefault();
			this.frameSequencerView.setNewPosition(0.05);

		break;
		case (37): //left
			this.frameSequencerView.setNewPosition(-0.05);
			e.preventDefault();
		break;
	}
}


module.exports = Page;