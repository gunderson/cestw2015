window.$ = window.jQuery = require('jquery');
window._ = require('underscore');
window.Backbone = require('backbone');
Backbone.$ = $;
require("jquery.browser");
require("jquery.gsap");
require("backbone.layoutmanager");
require("backbone.toggle");
require("./lib/Extensions");

var templates = require("./templates");
var App = require("./app");


var unsupportedBrowsers = [
	{
		name:"msie",
		versionNumber: 8
	}
];

var isUnsupported = _.reduce(unsupportedBrowsers, function(p,c,i,a){
	return p || ($.browser.name === c.name && $.browser.versionNumber <= c.versionNumber);
}, false);

if ($.browser.name === "msie" && $.browser.versionNumber === 9){
	$("html").addClass("i-use-an-old-buggy-browser-shame-on-me");
}



if (isUnsupported){
	$('#oldbrowsers').css("display", "table");
	return;
}



Backbone.Layout.configure({
	manage: true,
	fetchTemplate: function (path) {
		return templates[path];
	},
	setAppController: function(appController){
		this.appController = appController;
		if (this.model && this.model.setAppController){
			this.model.setAppController(appController);
		}
		if (this.controller && this.controller.setAppController){
			this.controller.setAppController(appController);
		}
	}
});


function onDocumentReady(){
	if (typeof window.ontouchstart !== "undefined"){
		$("html").addClass("touch");
	} else {
		$("html")
			.addClass("no-touch");
		$("html")
			.addClass("mutable");
	}

	if ($.browser.android){
		$("html").addClass("fullscreenable");
	}

	$('#noscript').css("display", "none");

	$('#main').css("display", "block");


	$.getJSON("data/en.json")
		.done(function(jsonResult){
			window.app = new App({
				copy: jsonResult
			});
		});
	
}

$(onDocumentReady);