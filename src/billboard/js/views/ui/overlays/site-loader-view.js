var $ = require("jquery");
require("backbone");
require("backbone.layoutmanager");
require("gsap");

var tl;
var MAX_ROTATION = 230;

var View = Backbone.Layout.extend({
	el: "#site-loader",
	events: {
		"click button.animate-in": "animateIn",
		"click button.animate-out": "animateOut",
		"click button.sim-load": "simulateLoad",
	},
	progress: 0,
	subProgress: 0,
	animating: false,
	animatedIn: false,
	hasRendered: false,
	afterRender: function(){
		this.$el.on("mousewheel", function(e){
			e.preventDefault();
		});

		this.$bigNeedle = this.$("#needle");
		this.$html = $("html");
		this.reset();
	},
	reset: function(){
		var needles = [this.$bigNeedle];
		tl = new TimelineMax({onUpdate:null, delay: 0})
			.to(needles, 0, {
				rotation:0,
				transformOrigin: "81.3% 32.4%"
			});
	},
	setSubProgress: function(progress){
		this.subProgress = progress;
		
	},
	setProgress: function(progress){
		this.progress = progress;
		if(!this.animatedIn) return;
		TweenMax.to(this.$bigNeedle, 0.5, {
			rotation: MAX_ROTATION * progress, 
			ease:"Power2.easeInOut"
		});
		
	},
	animateIn: function(){
		$("html").addClass("loading");		
		var needles = [this.$bigNeedle];
		this.animatedIn = false;
		var _this = this;
		// this.$el.css("opacity", 1);	


		tl = new TimelineMax({onUpdate:null, delay: 0})
			.to(needles, 1, {
				transformOrigin: "81.3% 32.4%",
				rotation: MAX_ROTATION, 
				ease:"Power2.easeInOut"
			})
			.to(needles, 2, {
				rotation: MAX_ROTATION * _this.progress, 
				ease:"Power2.easeInOut",
				onComplete: function(){
					_this.animatedIn = true;
				}
			});
	},
	animateOut: function(){
		var $html = $("html");
		var needles = [this.$bigNeedle];
		tl = tl || new TimelineMax({onUpdate:null, delay: 0});
		tl.to(needles, 1, {
				rotation:0,
				transformOrigin: "81.3% 32.4%",
				ease:"Power2.easeInOut"
			})
			.to(this.$el, 0.5, {
				alpha: 0,
				overwrite: true,
				onComplete: function(){
			   		$html.removeClass("loading");
				}
			});

	},
	simulateLoad: function(){

	}
});

module.exports = View;
