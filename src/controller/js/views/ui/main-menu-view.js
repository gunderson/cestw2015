require('backbone');
require("backbone.layoutmanager");
require('gsap');
var Analytics = require("../../services/AnalyticsService");
var Social = require('../../services/SocialService');

var isNavTransition = false;

var MainMenu = Backbone.Layout.extend({
	
	events:{
		"mouseenter a.closer": "onMenuItemMouseOver",
		//"mouseenter button>.content>.glyf": "onButtonMouseOver",
		"mouseenter .twitter-share": "onButtonMouseOver",
		"mouseenter .facebook-share": "onButtonMouseOver",
		"mouseenter .handle": "onButtonMouseOver",
		
		"click .handle": "onHandleClick",
		"click a.closer": "onMenuItemCloserClick",

		"click button.twitter-share": "onClickTwitterButton",
		"click button.facebook-share": "onClickFacebookButton",
		"click button.google-plus-share": "onClickGooglePlusButton",

		// "touchstart .handle": "onHandleClick",
		// "touchend a.closer": "onMenuItemCloserClick"
	},
	el: "#main-menu",
	initialize: function(){
		$("#pages .cover").click(
			_.bind(function(){
				this.app.media.playSound("menu-close");
				$("html").removeClass("menu-open");
				this.app.virtualScroll.attach();

			}, this)
		);
		this.onHandleClick = _.throttle(this.onHandleClick, 1000);
	},
	afterRender: function(){
		var closers = this.$("a.closer");
		var shareButtons = this.$(".share button");
		TweenMax.to(closers, 0.2, {autoAlpha: 0, delay: 0.8});
		TweenMax.to(shareButtons, 0.2, {autoAlpha: 0, delay: 0.8});
	},
	//input events
	onHandleClick: function(){
		var $h = $("html");
		$h.toggleClass("menu-open");
		var closers = this.$("a.closer");
		var shareButtons = this.$(".share button");

		if ($h.hasClass("menu-open")){
			this.app.media.playSound("menu-open");
			closers
				.css({
					transform: "",
					transition: "none"
				});
			TweenMax.staggerFromTo(closers, 0.8, 
				{
					xPercent: 150,
					autoAlpha:1
				}, {
					xPercent: 0,
					ease: "Expo.easeOut",
					autoAlpha:1
				}, 0.05,
				function(){
					closers 
					.css({
						transform: "",
						transition: ""
					});
				});
			TweenMax.to(shareButtons, 0, {autoAlpha: 1, delay: 0});
			this.app.virtualScroll.detach();
		} else {
			this.app.media.playSound("menu-close");
			TweenMax.to(closers, 0.2, {autoAlpha: 0, delay: 0.8});
			TweenMax.to(shareButtons, 0.2, {autoAlpha: 0, delay: 0.8});
			this.app.virtualScroll.attach();
		} 
		this.app.media.playSound("button-click");
	},
	onButtonMouseOver: function(){
		this.app.media.playSound("rollover");
	},
	onMenuItemMouseOver: function(){
		this.app.media.playSound("rollover");
	},
	onMenuItemCloserClick: function(e){
		if (isNavTransition){
			e.preventDefault();
			e.stopImmediagePropagation();
			return;
		}
		this.app.media.playSound("general_button_click");
		this.app.router.navigate(e.target.href.split("#")[1], { trigger:true });
		$("html").removeClass("menu-open");
		this.app.virtualScroll.attach()


		Analytics.trackEvent({
			event: "navClick",
			nav: $(e.target).text()
		});
	},
	onClickTwitterButton: function(){
		Social.shareTwitter({
			url: "",
			message: this.copy.sharing.main_menu.twitter.message,
			img: this.copy.sharing.main_menu.twitter.img,
			title: this.copy.sharing.main_menu.twitter.title
		});

		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Twitter",
			socialItem: "Site Share"
		});
	},
	onClickFacebookButton: function(){
		Social.shareFacebook({
			url: window.location.href,
			message: this.copy.sharing.main_menu.facebook.message,
			img: this.copy.sharing.main_menu.facebook.img,
			title: this.copy.sharing.main_menu.facebook.title
		});
		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Facebook",
			socialItem: "Site Share"
		});
	},
	onClickGooglePlusButton: function(){
		Social.shareGooglePlus({
			url: window.location.href,
			message: this.copy.sharing.main_menu.googleplus.message,
			img: this.copy.sharing.main_menu.googleplus.img,
			title: this.copy.sharing.main_menu.googleplus.title
		});
		Analytics.trackEvent({
			event: "socialClick",
			socialNetwork: "Google Plus",
			socialItem: "Site Share"
		});

	},

	template: null
});

module.exports = MainMenu;