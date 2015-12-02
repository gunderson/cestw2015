require("gsap");
require('pixi.js');
var AbstractPage = require("./Page-view");
var SectionPage = require('./locations-page/section-page-view');
var ResultsPage = require('./locations-page/results-page-view');
var DXPMapView = require("./locations-page/dxp-map-view");
var Social = require('../../services/SocialService');
var ENV = require("constants")[environment];
var Analytics = require("../../services/AnalyticsService");

var $html = $("html");

var currentStoreId = null;
var router;

var stage,
	renderer,
	requestId,
	dxpMap;

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:-2,
	keep:true,
	el: "#locations-page",
	events: {
		"click .enter-zip>.content>form>.input-field>.submit-button": "getStoreList",
		"focus .enter-zip>.content>form>.input-field": "onFocusZipcode",
		"input .enter-zip>.content>form>.input-field": "onInputZipcode",
		"click .vote>.content>.wrapper>form>.input-field>.submit-button": "onClickSubmitVote",
		"click .close-button": "onClickCloseButton",

		"click button.twitter-share": "onClickTwitterButton",
		"click button.facebook-share": "onClickFacebookButton",
		"click button.google-plus-share": "onClickGooglePlusButton",

		// "click button": "onButtonClick",
		"mouseover button>.content>.glyf": "onButtonRollover",

		// "mousewheel >.content": "onMouseWheel",
		"touchstart >.content": "onTouchstart",
		"touchend >.content": "onTouchEnd"
	},
	initialize: function(){
		AbstractPage.prototype.initialize.call(this);
		this.views = {
			"#enter-zip": new SectionPage({
				el: "section.enter-zip",
				col: 0,
				row: 0,
				route: "enter-zip",
				showCloseButton: false,
				transitionOutSound: "step1-2",
				transitionInComplete: function(){
					app.virtualScroll.attach();
				}
			}),
			"#results": new ResultsPage({
				el: "section.results",
				col: 0,
				row: 1,
				route: "results",
				transitionOutSound: "step2-3"

			}),

			"#vote": new SectionPage({
				el: "section.vote",
				col: 0,
				row: 2,
				route: "vote",
				transitionOutSound: "step3-4"
			}),

			"#confirmation": new SectionPage({
				el: "section.confirmation",
				col: 0,
				row: 3,
				route: "confirmation",
				transitionOutSound: "step4-1"
			}),
			"#dxp-map": dxpMap = new DXPMapView({
				el: "#dxp-map"
			})
		};

		this.onMouseWheel = _.bind(this.onMouseWheel, this);
		this.on("fetchComplete", this.onFetchComplete);

		this.mediaReadyPromise = $.Deferred();

		this.loadPromise = $.when(this.views[("#dxp-map")].loadPromise, this.mediaReadyPromise);
		this.loadPromise.then(function(){
			console.log("all loaded")
		});

		this.getStoreList = _.debounce(this.getStoreList, 500, true);
		dxpMap.on("introAnimationComplete", this.onIntroAnimationComplete, this);
	},

	setApp: function (app){
		AbstractPage.prototype.setApp.apply(this, arguments);
		router = app.router;
		_.each(this.views, function(view){
			view.app = app;
		});
		
		dxpMap.app = app;
	},

	// RENDERING

	/*
	beforeRender: function(){

	},

	*/
	afterRender: function(){
	},

	loadAssets: function(){
		if($("html").hasClass("mutable")){

			this.app.media.get("sounds")
	            .once("locations:ready", this.mediaReadyPromise.resolve)
	            .once("locations:ready", function(){
	            })
	            .add([
	                    {
	                        id: "step1-2",
	                        loop: false,
	                        preload: "auto",
	                        group: "locations",
	                        sources: ["ui/step1-2.ogg", "ui/step1-2.mp3"]
	                    },{
	                        id: "step2-3",
	                        loop: false,
	                        preload: "auto",
	                        group: "locations",
	                        sources: ["ui/step2-3.ogg", "ui/step2-3.mp3"]
	                    },{
	                        id: "step3-4",
	                        loop: false,
	                        preload: "auto",
	                        group: "locations",
	                        sources: ["ui/step3-4.ogg", "ui/step3-4.mp3"]
	                    },{
	                        id: "step4-1",
	                        loop: false,
	                        preload: "auto",
	                        group: "locations",
	                        sources: ["ui/step4-1.ogg", "ui/step4-1.mp3"]
	                    },
	                ]);
		} else {
			this.mediaReadyPromise.resolve();
		}
			this.mediaReadyPromise.resolve();

	},

	startIntroAnimation: function(){
		//do animation
		dxpMap.play();
		return this;
	},
	onIntroAnimationComplete: function(){
		this.app.router.navigate("#locations/enter-zip", {trigger:true});
		return this;
	},

	// EVENT HANDLERS
	onFetchComplete: function(){
		// this.app.router.navigate("#locations/enter-zip", {trigger:true});
	},
	onButtonRollover: function(){
		this.app.media.playSound("rollover");
	},
	onButtonClick: function(){
		this.app.media.playSound("button-click");
	},
	onClickTwitterButton: function(){
		Social.shareTwitter({
			url: "",
			message: this.copy.sharing.twitter.message,
			img: this.copy.sharing.twitter.img,
			title: this.copy.sharing.twitter.title
		});

		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Twitter",
			socialItem: "Locations"
		});
	},
	onClickFacebookButton: function(){
		Social.shareFacebook({
			url: window.location.href,
			message: this.copy.sharing.facebook.message,
			img: this.copy.sharing.facebook.img,
			title: this.copy.sharing.facebook.title
		});

		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Facebook",
			socialItem: "Locations"
		});
	},
	onClickGooglePlusButton: function(){
		Social.shareGooglePlus({
			url: window.location.href,
			message: this.copy.sharing.googleplus.message,
			img: this.copy.sharing.googleplus.img,
			title: this.copy.sharing.googleplus.title
		});

		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Google Plus",
			socialItem: "Locations"
		});

	},
	mouseWheelDisplacement: 0,
	onMouseWheel: function(e){
		if (!$html.hasClass("enter-zip-page")) return
		this.mouseWheelDisplacement += -e.deltaY + e.deltaX;
		if (this.mouseWheelDisplacement > 300){
			this.app.router.navigate("#explore", {trigger:true});
		} else {
			this.mouseWheelDisplacement = Math.max(0, this.mouseWheelDisplacement);
		}
	},
	onTouchstart: function(e){
		var totalDisplacement = 0,
			startX = e.originalEvent.touches[0].pageX,
			startY = e.originalEvent.touches[0].pageY;
		this.$el.on("touchmove", _.bind(onTouchMove, this));
		function onTouchMove(e){
			totalDisplacement = e.originalEvent.touches[0].pageX - startX;
			// console.log("totalDisplacement", totalDisplacement)
			if (totalDisplacement < -0.1 * window.innerWidth){
				this.$el.off("touchmove");
				this.app.router.navigate("#explore", {trigger:true});
			}
			totalDisplacement = Math.max(200, totalDisplacement);
		}
	},
	onTouchEnd: function(){
		this.$el.off("touchmove");
	},
	onClickCloseButton: function(){
		// this.app.media.playSound("step4-1");
		this.app.router.navigate("#locations/enter-zip", {trigger:true});
		return this;
	},

	onClickSubmitVote: function(e){
		// TODO: validate form




		e.preventDefault();
		var invalid = [];
		var $emailAddress = this.$(".vote .email-address");
		if (!validateEmail($emailAddress.val())){
			invalid.push({
				obj: $emailAddress,
				message: "Please enter a valid email address."
			});
		}
		var $acceptTerms = this.$(".vote .subscribe");
		if (!$acceptTerms.val()){
			invalid.push({
				obj: $acceptTerms,
				message: "You must accept the terms and conditions."
			});
		}
		this.$(".vote .error-messages").hide();
		if (invalid.length) {
			this.$(".vote label").removeClass("invalid");
			this.$(".vote .error-messages").show();
			_.each(invalid, function(error){
				error.obj.parent().addClass("invalid");
				this.$(".vote .error-messages").append("<p>" + error.message + "</p>");
			});
			return;
		}

		var optin = this.$(".vote .subscribe").val();

		$.ajax({
			url: ENV.api_root + "api.php",
			type: "POST",
			data: {
				method: "dxp_vote",
				email: $emailAddress.val(),
				store_id: currentStoreId,
				opt_in: optin
			}
		})
		.then(function(){
			Analytics.trackEvent({
	            event: "voteSuccess",
	            "subscribe": optin
	        });
		})
		.done(this.onSendVoteComplete.bind(this));

	},

	onSendVoteComplete: function(ret){
		this.app.router.navigate("#locations/confirmation", {trigger:true});

	},

	// TRANSITIONS
	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
		this.mouseWheelDisplacement = 0;
		app.on("vscroll", this.onMouseWheel);
		return this;
	},
	transitionInComplete: function(){
		this.startIntroAnimation();
		this.mouseWheelDisplacement = 0;
		this.app.trigger("progress", {
			"sceneId": 13,
			"progress": 0
		});
		this.mouseWheelDisplacement = 0;
		return this;
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		this.getView("#dxp-map").stop();
		app.off("vscroll", this.onMouseWheel);
		return this;
	},
	transitionOutComplete: function(){

		return this;
	},
	onFocusZipcode: function(){
		this.$("input.zip-code").removeClass("invalid");
	},
	onInputZipcode: function(e){
		e.target.value = e.target.value.replace(/\D+/g, "");
		this.$("input.zip-code").removeClass("invalid");

		console.log(e.target.value);
	},
	getStoreList: function(e){
		e.preventDefault();
		// show site loader
		var zipcode = this.$("input.zip-code").val();

		if (zipcode.length !== 5){
			return this.$("input.zip-code").addClass("invalid");
		}


		this.zipcode = zipcode;
		$.ajax({
			url: ENV.api_root + "api.php",
			type: "GET",
			data: {
				method: "dxp_stores",
				zipcode: zipcode
			}
		}).done(this.onGetStoreListComplete.bind(this));

		Analytics.trackEvent({
            event: "searchLocation",
            "location": zipcode
        });
	}, 
	onGetStoreListComplete: function(data){
		if (!data.success){
			return this.$("input.zip-code").addClass("invalid");
		}

		this.app.virtualScroll.detach();


		//hide site loader
		var resultsView = this.views["#results"];
		resultsView.$("span.zipcode").text(this.zipcode);
		resultsView.once("afterRender", function(){
			this.app.router.navigate("#locations/results", {trigger:true});
		}, this);
		resultsView.stores.reset(data.stores);
	}
});

function validateEmail(emailAddress){

	// http://stackoverflow.com/questions/46155/validate-email-address-in-javascript

	var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(emailAddress);
}







module.exports = Page;