var $ = require("jquery");
require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	el: "footer",
	events: {
		"click .mute-button": "onClickToggleMute",
		"click .fullscreen-button": "onClickFullScreen",
		//"mouseenter .mute-button>.content>.glyf": "onRolloverButton"
		"mouseenter button.mute-button": "onRolloverButton",
	},
	onClickToggleMute: function(e){
		e.preventDefault();
		var $html = $("html");
		var muted = $html.hasClass("muted");

		if (muted) {
			$html.removeClass("muted");
			app.media.unMute();
		} else {
			$html.addClass("muted");
			app.media.mute();
		} 
	},
	onClickFullScreen: function(){
		toggleFullScreen();
	},
	onRolloverButton: function(){
		this.app.media.playSound("rollover");
	}
});

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

module.exports = View;