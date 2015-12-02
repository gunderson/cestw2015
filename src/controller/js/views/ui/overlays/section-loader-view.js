var $ = require("jquery");
require("backbone");
require("backbone.layoutmanager");
require("gsap");

var tl;
var MAX_ROTATION = 230;

var View = Backbone.Layout.extend({
	el: "#section-loader",
	progress: 0,
	subProgress: 0,
	animating: false,
	animatedIn: false,
	hasRendered: false,
	afterRender: function(){
		this.$el.on("mousewheel", function(e){
			e.preventDefault();
		});

		this.$html = $("html");
		this.reset();
	},
	reset: function(){
		
	},
	setProgress: function(progress, silent){
		// console.log(progress);
		var numFrames = 7;
		var frameWidth = 1 / numFrames;
		this.progress = progress;
		this.$(".indicator").css({
			backgroundPosition: (100*Math.round(progress / frameWidth) * frameWidth) + "%"
		});
		this.$(".loader-block h1").text("BUFFERING - " + Math.round(progress * 100) + "%");
		if (silent){
			this.animateOut();
		} else {
			this.animateIn();
		}
	},
	animateIn: function(){
		if (this.animatedIn) return;
		this.animatedIn = true;
		$("html").addClass("section-loading");	
		this.$el.css("opacity", 1);	
	},
	animateOut: function(){
		if (!this.animatedIn) return;
		this.animatedIn = false;
		$("html").removeClass("section-loading");	
	},
	simulateLoad: function(){

	}
});

module.exports = View;