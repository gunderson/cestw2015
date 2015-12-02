var Backbone = require("backbone");

Backbone.Model.prototype.toggle = function(attr){
	return this.set(attr, !this.get(attr));
};