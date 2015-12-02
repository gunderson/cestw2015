var AbstractPage = require("../Page-view");

var SectionPage = AbstractPage.extend({
	showCloseButton: true,
	layerAnimationOffset: 0,
	events: {
		"mousewheel .wrapper": "onMouseWheel"
	},
	initialize: function(options){
		AbstractPage.prototype.initialize.call(this);
		_.extend(this, options);
	},
	onMouseWheel: function(e){
		e.stopImmediatePropagation();
	},
	transitionIn: function(){
		this.$el.show();
		AbstractPage.prototype.transitionIn.apply(this, arguments);
		if (this.showCloseButton){
			this.$("button.close-button").show();
			$("#main-menu .hamburger").hide();
		} else {
			this.$("button.close-button").hide();
			$("#main-menu .hamburger").show();
		}
		return this;
	},
	transitionInComplete: function(){
		return this;
	},
	transitionOut: function(){
		this.app.media.playSound(this.transitionOutSound);
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		return this;
	},
	transitionOutComplete: function(){
		this.$el.hide();
		return this;
	}
});

module.exports = SectionPage;