require("backbone");
require("backbone.layoutmanager");
require("gsap");


var PAGE_TRANSITION_DURATION = 1;



//abstract page class
var Page = Backbone.Layout.extend({
	col:0,
	row: 0,
	currentRoute: "",
	page: null,
	loadType: "section",
	views: {},
	initialize: function(){
		this.on("transitionInComplete", this.transitionInComplete);
		this.on("transitionOutComplete", this.transitionOutComplete);
	},
	setApp: function(app){
		this.app = app;
	},
	loadAssets: function(){
		//override this
	},
	setCopy: function(copy){
		this.copy = copy;
	},
	fetch: function(params, promise){

		promise = promise || new $.Deferred();

		var recallFetch = function(){
			this.fetch(params, promise);
			return promise;
		}.bind(this);
		
		// first load the model if there is one
		if (false && this.model && this.model.url){
			console.log(this.el.id + " fetching the model");
			this.loadPromise = this.model.fetch()
				.done(recallFetch);

		//then render
		} else if (!this.hasRendered) {
			console.log(this.el.id + " render");
			this.render()
				.then(recallFetch);

		//then wait for the components to load
		} else if (this.loadPromise && this.loadPromise.state() === "pending") {
			console.log(this.el.id + " waiting for load");
			this.trigger("loadStart", {
				type: this.loadType,
				id: this.route
			});

			this.loadAssets();
			this.loadPromise
				// .then(function(){
				// 	this.loadPromise = null;
				// }.bind(this))
				.then(recallFetch);
		
		//then you're good to go
		} else {

			console.log(this.el.id + " finished fetching view");
			if (this.loadPromise){
				console.log(this.el.id, this.loadPromise.state());
			}
			_.defer(function(){
				promise.resolve();
			});
			this.trigger("fetchComplete", this);
			this.trigger("loadComplete", {
				type: "section",
				id: this.route
			});

		}

		return promise;

	},
	onRoute: function (route, params) {



        var currentPage = this.page;
        var newPage = null;

        // console.log(this, route, this.currentRoute);

        // only do this if new route is different from the last
        if (route !== null && route !== this.currentRoute ) {

        	// remove the old page
            $("html").removeClass(this.currentRoute + "-page");

            if (route){
                $("html").addClass(route + "-page");
	        	
	        	//determine new page
	        	newPage = this.views["#" + route];
            }

            //if the route is invalid, do nothing
        	if (!newPage) return;
        	
        	var _this = this;
        	newPage.fetch(params)
                .done(function(){
        			_this.trigger("loadEnd");

            		if (currentPage) { currentPage.transitionOut(newPage); }
            		newPage.transitionIn(currentPage);
            		if (params && params.length > 0){
            			newPage.onRoute(params[0], params.slice(1));
            		}

            	});

        	this.page = newPage;
        } else if(route === null && currentPage) {
        	//currentPage.transitionOut();

        } else if (route !== null){
            // it's probably a sub-page
            // tell the current page to display the new info
            // console.log('onRoute: currentRoute is the same as new route\n', route, params);
            currentPage.onRoute(params[0], params.slice(1));

        }
        this.currentRoute = route;
    },
    clearSubPage: function(){

    },
    layerAnimationOffset: -0.25,
	transitionIn: function(prev){
		


		this.$(".cover").on("mousewheel", function(e){e.preventDefault();});

		TweenMax.to( ["#scene-menu", "header #main-logo"], 1, { autoAlpha: 1 });

		var _this = this;
		this.$el.addClass('active');

		if (!prev){
			//console.log("No Previous Page");
			this.$el.show();
			TweenMax.to(this.$(".cover"), 0, {autoAlpha: 0});
			this.trigger("transitionInComplete");
			return this;
		}

		TweenMax.fromTo(this.$(".cover"), PAGE_TRANSITION_DURATION, 
			{
				autoAlpha: 1
			},
			{
				autoAlpha: 0,
				ease: "Power4.easeOut",
				overwrite: true
			});

		
		var startX = 0,startY = 0;

		if (this.col < prev.col){
			startX = "-100";
			this.app.media.playSound("page-forward");
		} else if (this.col > prev.col){
			startX = "100";
			this.app.media.playSound("page-back");
		} else if (this.row < prev.row){
			startY = "100";
		} else if (this.row > prev.row){
			startY = "-100";
		}

		TweenMax.fromTo(this.$el, PAGE_TRANSITION_DURATION, {
			display: "block",
			x: startX + "%",
			y: startY + "%"
		}, {
			x: "0%",
			y: "0%",
			ease: "Power4.easeOut",
			onComplete: function(){
				_this.trigger("transitionInComplete");
			},
			overwrite: true
		});


		TweenMax.fromTo(this.$el.find("> .content"), PAGE_TRANSITION_DURATION, {
			x: (startX * this.layerAnimationOffset) + "%",
			y: (startY * this.layerAnimationOffset) + "%"
		}, {
			x: "0%",
			y: "0%",
			ease: "Power4.easeOut",
			overwrite: true
		});
		
		return [startX, startY];
	},
	transitionOut: function(next){
		var _this = this;
		this.$el.removeClass('active');
		this.$(".cover").off("mousewheel");



		TweenMax.fromTo(this.$(".cover"), PAGE_TRANSITION_DURATION, 
			{
				autoAlpha: 0
			},
			{
				autoAlpha: 1,
				ease: "Power4.easeOut",
				overwrite: true
			});


		var endX = 0, endY = 0;

		//transition out to the right by default
		if (!next || this.col > next.col){
			endX = "100";
		} else if (this.col < next.col){
			endX = "-100";
		} else if (this.row < next.row){
			endY = "100";
		} else if (this.row > next.row){
			endY = "-100";
		}

		TweenMax.fromTo(this.$el, PAGE_TRANSITION_DURATION, {
			// display: "block",
			x: "0%",
			y: "0%"
		}, {
			x: endX + "%",
			y: endY + "%",
			ease: "Power4.easeOut",
			onComplete: function(){
				_this.$el.hide();
				_this.trigger("transitionOutComplete");
			},
			overwrite: true
		});


		TweenMax.fromTo(this.$el.find("> .content"), PAGE_TRANSITION_DURATION, {
			// display: "block",
			x: "0%",
			y: "0%"
		}, {
			x: (endX * this.layerAnimationOffset) + "%",
			y: (endY * this.layerAnimationOffset) + "%",
			ease: "Power4.easeOut",
			overwrite: true
		});

		return [endX, endY];
	},
	transitionInComplete: function(){
	},
	transitionOutComplete: function(){
		this.$(".cover").off("mousewheel");
	},
});

module.exports = Page;