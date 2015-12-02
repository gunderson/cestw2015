require("backbone");

var isEntry = true;

var Router = Backbone.Router.extend({
	initialize: function(){
		this.on("route", this.onRoute);
	},
	routes: {
		"": "home",
		"home(/:subpage)": "home",
		"explore": "explore",
		"locations(/:subpage)": "locations",
	},
	locations: function(subpage){
		console.log("isEntry", isEntry);
		if (!subpage){
			this.navigate("#locations/enter-zip", {trigger:true});
		}
	},
	onRoute: function(){
		isEntry = false;
	}
});

var router = new Router();

module.exports = router;