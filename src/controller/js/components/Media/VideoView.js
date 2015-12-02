define(function(require, exports, module) {
		var _ = require("underscore");
		var $ = require("jquery");
		var Backbone = require("backbone");
		var Controller = require("modules/media/Media");

		var View = Backbone.View.extend({
			template: "stories/Video",
			events: {
				"click": "togglePlay"
			},
			className: "fill",
			initialize: function(){
				this.listenTo(app, "resize", this.onResize);
			},
			afterRender: function(){
				if (this.model){
					var $vid = this.model.get("$el")
					this.$el.prepend($vid);
					$vid.on("timeupdate", _.bind(this.updateProgressBar, this));
					$vid.on("progress", _.bind(this.updateBufferBar, this));
					this.model.on("play", _.bind(this.onPlay, this));
					this.model.on("pause", _.bind(this.onPause, this));
				} else {
					console.error("Video must be instantiated with a Media.Video as a model")
				}
				this.onResize();
			},
			cleanup: function(){

			},
			updateProgressBar: function(e){
				var $vid = this.model.get("$el"),
					currentTime =  $vid[0].currentTime,
					duration =  $vid[0].duration,
					percentComplete = 100*(currentTime / duration);
				this.$('.progressBar').css({
					width: percentComplete+"%"
				});
			},
			updateBufferBar: function(e){
				var $vid = this.model.get("$el"),
					timeRanges = $vid[0].buffered;
				if (timeRanges.length >= 1){
						buffered =  $vid[0].buffered.end(0),
						duration =  $vid[0].duration,
						percentComplete = 100*(buffered / duration);
					this.$('.bufferBar').css({
						width: percentComplete+"%"
					});
				}
			},
			onResize: function(){
				// this.$(".dim").css(app.dimensions.storyFill);
				if ($.browser.ipad && $.browser.ios7){
					this.$("video, .dim").css({
						width: "100%",
						height: "100%"
					});

				} else {
					this.$("video, .dim").css(app.dimensions.storyFill);
				}
				// this.model.get('$el').css(app.dimensions.fill);
			},
			transitionIn: function(){
				// console.log("Video."+"transitionIn()", this);
				var _this = this;
				_.defer(function(){

				_this.$el.css({
							opacity:0
						})
					.animate({
							opacity:1
						},
						500).promise()
					.done(function(){
						_this.model.play();
						_this.trigger('transitionInComplete');
					});
				});
			},
			transitionOut: function(){
				var _this = this;
				this.model.pause();
				this.$el.animate({
						opacity:0
					},500).promise()
					.done(function(){
						_this.trigger('transitionOutComplete');
						_this.remove();
					});
			},
			togglePlay: function(){
				this.model.togglePlay();
				app.trigger('hideSiteFooter');
			},

			// Event Handlers
			onPlay: function(){
				var _this = this;
				this.$(".dim").animate({
					opacity:0
				}, 500).promise().done(function(){
					_this.$(".dim").hide();
				});
			},
			onPause: function(){
				this.$(".dim").css({
					display: "block",
					opacity: 0
				}, 500).animate({
					opacity:0.5
				});
			}
		});
		return View;
	}
);