var _ = require("underscore");
require("backbone");

var Model = Backbone.Model.extend({
	fetch: fetch,
	active: false
});

function fetch(){
	this.set("active", true);
}



module.exports = Model;