var Backbone = require("backbone");
var FrameModel = require("./frame-model");

var Collection = Backbone.Collection.extend({
	model: FrameModel,
	dispose: function() {
		this.each(function(model) {
			model.dispose();
		});
		this.reset();
		return this;
	}
});

module.exports = Collection;