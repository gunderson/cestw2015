var _ = require("underscore");
var $ = require("jquery");
var Backbone = require("backbone");
var FrameCollection = require("./frame-collection");
var FrameModel = require("./frame-model");
require("gsap");

var Model = Backbone.Model.extend({
	defaults: function(){
		return {
			frames: new FrameCollection(),
			currentFrame: -1,
			timelinePosition: 0,
			active: false,
			numImages: 0,
			numLoaded: 0,
			loadProgress: 0,
			loadPromise: null,
			minSize: 512,
			cdn: ""
		};
	},
	url: null,
	initialize: function() {
		this.destinationFrame = 0;
		this.onInitialLoadComplete = this.onInitialLoadComplete.bind(this);

		this.on("change:currentFrame", this.onChangeCurrentFrame, this);
		this.on("change:timelinePosition", this.onChangeTimelinePosition, this);
		this.on("change:active", this.onChangeActive, this);
	},
	onChangeActive: function(obj, val){
		if (val){
			var lp = this.loadFrames()
				.then(this.onInitialLoadComplete)
				.progress(this.onInitialLoadProgress);
		}
	},
	fetch: function(){
		this.set({"active": true});
		return this.get("loadPromise");
	},
	loadFrames: function() {
		console.log("loading them spin frames");
		var model,
			collection = this.get("frames"),
			numImages = this.get("numImages"),
			promises = [],
			src, 
			_this = this,
			i = numImages - collection.length;

		while (i--) {
			src = this.constructImgURL(this.get("minSize"), i);
			model = new FrameModel({
				"cdn": this.get("cdn"),
				"size": window.assetSize, // full size image, ducument media sizes
			});
			collection.add(model);

			model.set({
					"id": i,
					"index": i,
					"src": src,
					"active": true //intiialize load
				})
				.set({
					"active": false
				});

			promises.push(model.loadPromise);
			model.loadPromise.then(_.bind(this.onInitialLoadProgress, this));

			var $img = model.get('$img');
		}

		var lp = $.when.apply(this, promises);
			
		this.set("loadPromise", lp);
		return lp;
	},
	constructImgURL: function(size, frameNumber) {
		frameNumber = (parseInt(frameNumber, 10)) + 1;
		return this.get("cdn") + "assets/images_sized/" + size + "/explore-page/spin/" + frameNumber.pad(2) + ".png";
	},
	onInitialLoadProgress: function(data) {
		var numLoaded = this.get("numLoaded") + 1;
		this.set({
			"numLoaded": numLoaded,
			"loadProgress" : numLoaded / this.get("numImages")
		});
	},
	onInitialLoadComplete: function(data) {
		console.log("onInitialLoadComplete");
		this.stopListening(this.initialFrameLoader);
		this.initialFrameLoader = null;
		this.set({
			currentFrame: 0,
			numLoaded: this.get("numImages")
		});
		this.trigger('loadComplete');
	},
	onNewLoad: function(){
		if (this.tween) TweenMax.killTweensOf(this);
	},
	onChangeTimelinePosition: function(obj, val) {
		// console.log("onChangeTimelinePosition", val);
		//don't do anything if the menu opens
		if ($("body").hasClass('menu-open')){
			TweenMax.killTweensOf(this);
			return;
		}

		var _this = this;

		var newFrame = (val * (this.get('frames').length - 1)) >> 0;
		this.tween = TweenMax.to(this, 0.55, {
			destinationFrame: newFrame,
			ease: "easeOutQuad",
			onUpdate: function() {
				_this.set({
					currentFrame: Math.round(_this.destinationFrame)
				});
			}
		});
	},
	startLoadingHigherResImages: function(){
		var _this = this;
		this.get('frames').each(function(frame, i){
			frame.set({
				src: _this.constructImgURL(window.assetSize, i)
			});
		});
	},
	onChangeCurrentFrame: function(obj, val) {
		// console.log("onChangeCurrentFrame", val);
		var frames = this.get("frames");

		frames.each(function(frame){
			frame.set("active", false);
		});
		
		if (!frames) return console.log("No Frames");
		var frame = frames.get(val);
		
		if (!frame) return console.log("No Frames at", val);
		frame.set({
			size: window.assetSize,
			active: true
		});

		var total = this.get("numImages");
		var current = val + 1;

		this.trigger("progress", current/total);
	},
	dispose: function() {
		var frames = this.get("frames");
		frames.dispose();
		this.set('frames', null);
		return this;
	}
});

module.exports = Model;



(function(Number){
    Number.prototype.pad = function(minLength) {
      var N = Math.pow(10, minLength);
      return this < N ? ("" + (N + this)).slice(1) : "" + this;
    };
})(Number);