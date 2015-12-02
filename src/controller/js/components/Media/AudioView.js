define(function(require, exports, module) {
		var _ = require("underscore");
		var $ = require("jquery");
		var Controller = require("modules/media/Media");
		var Backbone = require("backbone");
		
		var View = Backbone.View.extend({
			//template: "media/Audio",
			// tagName: "div",
			intialize: function(){
			},
			afterRender: function(){
			},
			serialize: function(){
				return _.extend({}, app);
			}
		});
		return View;
	}
);