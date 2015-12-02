var _ = require("underscore");
var $ = require("jquery");
var Backbone = require("backbone");

var Model = Backbone.Model.extend({
	defaults: {
		index: null,
		$img: null,
		$bufferImg: null,
		passion: 'all',
		size: 512,
		loaded: [],
		active: false,
		cdn: ""
	},
	initialize: function() {
		this.set('loaded', []);
		var $img = $("<img alt='image sequence'>");
		var $bufferImg = $("<img>");

		this.set({
			"$img": $img,
			"$bufferImg": $bufferImg
		});
		$bufferImg.on("load", _.bind(this.onBufferImgLoaded, this));
		
		this.listenTo(this, "change:active", this.onChangeActive);
		this.listenTo(this, "change:src", this.onChangeSource);

		this.onChangeActive = _.bind(this.onChangeActive, this);
	},
	constructImgURL: function(size, frameNumber) {
		frameNumber = (parseInt(frameNumber, 10)) + 1;
		return this.get("cdn") + "assets/images_sized/" + size + "/explore-page/spin/" + frameNumber.pad(2) + ".png";
	},
	onChangeActive: function(obj, val){
		// console.log("Changed Active", val);
		var $img = this.get('$img');
		if (!val) {
			//make inactive
			clearTimeout(this.activeTimer);
			$img.css('visibility', 'hidden');
			return;
		}
		
		$img.css('visibility', 'visible');
		this.activeTimer = setTimeout(
			_.bind(function(){
				if (this.get('active')){
					//load the big image
					var bigSrc = this.constructImgURL(this.get('size'), this.get("index"));
					// console.log("Load ", bigSrc);
					this.get('$bufferImg')
						.attr("src", bigSrc);
				}
			},this),
		100);


	},
	onChangeSource: function(obj, val) {
		this.get("$bufferImg").attr('src', this.get('src'));
		this.loadPromise = $.Deferred();
	},
	onBufferImgLoaded: function(e) {
		var $bufferImg = this.get("$bufferImg"),
			newSrc = $bufferImg.attr('src');
		this.get('$img').attr('src', newSrc);
		$bufferImg.attr('src', "");
		this.trigger("loaded");
		this.loadPromise.resolve();
	},
	dispose: function() {
		clearTimeout(this.activeTimer);
		this.stopListening();
		this.get("$img").attr('src', "");
		this.get("$bufferImg").attr('src', "").off();
		this.set({
			$img: null,
			$bufferImg: null,
			loaded:null
		});
		return this;
	}
});

module.exports = Model;