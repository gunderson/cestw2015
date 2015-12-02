require('backbone');
require("backbone.layoutmanager");
require('gsap');

var isNavTransition = false;
var prevScene = -1;

var View = Backbone.Layout.extend({
	el: "#scene-menu",
	events:{
		"click a": "onCircleClick",
	},
	initialize: function(){

	},
	setApp: function(app){
		this.app = app;
		this.listenTo(app, "progress", this.onSceneProgress);
	},
	afterRender: function(){
		this.$as = this.$("a");
	},
	//input events
	onCircleClick: function(e){
	},
	onSceneProgress: function(data){
		var currentScene = data.sceneId;
		// if we change scenes, update all the scenes
		if (currentScene !== prevScene){
			_.each(this.$as, function(a){
				var $a = $(a);
				if ($a.data("sceneId") < currentScene){
					$a.removeClass("active")
						.find(".progress-bar .progress-marker")
						.css({
							transform: "scale(1,1)",
							msTransform: "scale(1,1)"
						});
				} else if ($a.data("sceneId") > currentScene){
					$a.removeClass("active")
						.find(".progress-bar .progress-marker")
						.css({
							transform: "scale(0,1)",
							msTransform: "scale(0,1)"
						});
				} 
			});
			var active = _.find(this.$as, function(a){
				var $a = $(a);
				return $a.data("sceneId") == currentScene;
			});
			this.$active = $(active).addClass("active");
		}

		this.$active
			.find(".progress-bar .progress-marker")
			.css({
				transform: "scale("+ data.progress +", 1)",
				msTransform: "scale("+ data.progress +", 1)"
			});
	
		prevScene = currentScene;
	}
});

module.exports = View;