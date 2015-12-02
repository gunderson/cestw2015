var SectionPage = require("./section-page-view");
var Analytics = require("../../../services/AnalyticsService");

var ResultsPage = SectionPage.extend({
	stores: new Backbone.Collection(),
	keep: true,
	events: {
		"click .buy-pizza-button": "onClickBuyPizzaButton",
	},
	initialize: function(options){
		SectionPage.prototype.initialize.apply(this, arguments);
		this.stores.on("reset", this.render, this);
	},
	beforeRender: function(){
		var withDXP = this.stores.where({hasDXP: true});
		var withoutDXP = this.stores.where({hasDXP: false});

		withDXP = _.map(withDXP, function(model){
			return new StoreView({model:model});
		});

		withoutDXP = _.map(withoutDXP, function(model){
			return new StoreView({model:model});
		});


		this.setViews({
			".with-dxp .stores": withDXP,
			".without-dxp .stores": withoutDXP,
		});
	},
	afterRender: function(){
		var withDXP = this.stores.where({hasDXP: true});
		var withoutDXP = this.stores.where({hasDXP: false});
		this.$(".lists").scrollTop(0);

		if (!withDXP.length && !withoutDXP.length){
			this.$(".not-found").show();
			this.$(".found").hide();
		} else {
			this.$(".not-found").hide();
			this.$(".found").show();
		}

		if (!withDXP.length){
			this.$(".with-dxp").hide();
			if (withoutDXP.length){
				this.$(".without-dxp").show();
			}
		} else {
			this.$(".with-dxp").show();
			this.$(".without-dxp").hide();
		}

	},
	onClickBuyPizzaButton: function(e){
		Analytics.trackEvent({
            event: "orderPizza"
        });
	}
});

var StoreView = Backbone.Layout.extend({
	template: "pages/locations-page/store-list-item",
	el: false,
	events: {
		"click .buy-pizza-button": "onClickBuyPizzaButton",
		"click .vote-button": "onClickVoteButton"
	},
	initialize: function(options){
	},
	afterRender: function(){
		var storeName = this.$(".store").text();
		var orderLink = this.$(".order .order").attr("href");
		var div = $("<div class='store'>").text(storeName);
		this.$(".store").replaceWith(div);
		this.$(">a").attr("href", orderLink);
		this.$(".vote-button").attr("title", "Vote for store " + this.model.get("id"));
	},
	onClickVoteButton: function(e){
		currentStoreId = this.model.get("id");
		window.location.href = "#/locations/vote";
		 Analytics.trackEvent({
            event: "voteClick",
            "storeId": this.model.get("id")
        });
	},
	onClickBuyPizzaButton: function(e){
		Analytics.trackEvent({
            event: "orderPizza",
            "storeId": this.model.get("id")
        });
	}
});

module.exports = ResultsPage;