require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");
var VirtualScroll = require("./lib/VirtualScroll");
var Analytics = require("./services/AnalyticsService").init();
var Media = require("./components/Media/Media");

var $html = $('html');

//-------------------------------------------------------------
// Top Level Models

//-------------------------------------------------------------
// Controllers


// Instances

    var router       = require("./controllers/router");
    
    //-------------------------------------------------------------
    // Top level Views
    
    var AbstractPage      = require("./views/pages/Page-view");
    var MainMenu          = require("./views/ui/main-menu-view");
    var SceneMenu         = require("./views/ui/scene-menu-view");
    var Footer            = require("./views/ui/footer-view");
    var HomePage          = require("./views/pages/home-page-view");
    var ExplorePage       = require("./views/pages/explore-page-view");
    var WherePage         = require("./views/pages/locations-page-view");
    var SiteLoaderView    = require("./views/ui/overlays/site-loader-view");
    var SectionLoaderView = require("./views/ui/overlays/section-loader-view");
    
    // Instances
    
    var pages = {
        "#home"      : new HomePage({route: "#", analyticsId: "story"}),
        "#explore"   : new ExplorePage({route: "#explore", analyticsId: "explore"}),
        "#locations" : new WherePage({route: "#locations", analyticsId: "locations"}),
    };
    
    var overlays = {
        //loaders
        "#site-loader"    : new SiteLoaderView(),
        "#section-loader" : new SectionLoaderView(),
        //error messages
    };
    
    var ui = {
    "#main-menu"  : new MainMenu(),
    "#scene-menu" : new SceneMenu(),
    "footer"      : new Footer()
};


//-------------------------------------------------------------
// Application

var firstUserEvent = null;

module.exports = AbstractPage.extend({
    media: new Media.Controller({
        audioRoot: window.cdn + "assets/sounds/",
        videoRoot: window.cdn + "assets/videos/",
        imageRoot: window.cdn + "assets/images/"
    }),
    controller: _.extend({}, Backbone.Events),
    router: router,
    el: "#main",
    loadType: "site",
    views: _.extend({}, ui, pages, overlays),
    initialize: function (options) {
        var _this = this;
        this.copy = options.copy;
        this.virtualScroll = new VirtualScroll().attach();

        // assign controller to each view
        _.each(this.views, function(v){
            if (typeof v.setApp === "function"){
                v.setApp(_this);
            } else {
                v.app = _this;
            }
            if (typeof v.setCopy === "function"){
                v.setCopy(_this.copy);
            } else {
                v.copy = _this.copy;
            }
    	});

        _.each(pages, function(pageView){
            _this.listenTo(pageView, "loadStart", onloadStart);
            _this.listenTo(pageView, "loadProgress", onloadProgress);
            _this.listenTo(pageView, "loadComplete", onloadEnd);

            // page level analytics
            _this.listenTo(pageView, "fetchComplete", function(view){
                Analytics.trackEvent({
                    event: "sectionView",
                    "section": view.analyticsId || view.route
                });
            }, _this);
        });

        this.on("start", function(data){
            Analytics.trackEvent({
                event: "sectionView",
                "section": "Scene " + data.sceneId
            });
        });

        var firstTouchPromise = $.Deferred();
        var mediaReadyPromise = $.Deferred();
        var musicReadyPromise = $.Deferred();

        $.when(firstTouchPromise, mediaReadyPromise, musicReadyPromise)
            .then(function(){
                app.media.playSound("bg-music");
            });

        this.media.get("sounds")
            .once("universal:ready", musicReadyPromise.resolve)
            .once("universal:ready", mediaReadyPromise.resolve);

        if ($html.hasClass("no-touch")){
            $.when(firstTouchPromise, mediaReadyPromise, musicReadyPromise)
                .then(function(){
                    app.media.playSound("bg-music");
                });
            this.media.get("sounds")
                .add([
                        {
                            id: "bg-music",
                            loop: true,
                            preload: "auto",
                            group: "universal",
                            sources: ["music.mp3", "music.ogg"],
                            volume: 0.6,
                            filesize: 1800
                        },{
                            id: "menu-open",
                            loop: false,
                            preload: "auto",
                            group: "universal",
                            sources: ["ui/menu-open.mp3", "ui/menu-open.ogg"],
                            filesize: 1800
                        },{
                            id: "menu-close",
                            loop: false,
                            preload: "auto",
                            group: "universal",
                            sources: ["ui/menu-close.mp3", "ui/menu-close.ogg"]
                        },{
                            id: "button-click",
                            loop: false,
                            preload: "auto",
                            group: "universal",
                            sources: ["ui/click.mp3", "ui/click.ogg"]
                        },{
                            id: "ro-0",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-0.mp3", "ui/ro-0.ogg"]
                        },{
                            id: "ro-1",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-1.mp3", "ui/ro-1.ogg"]
                        },{
                            id: "ro-2",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-2.mp3", "ui/ro-2.ogg"]
                        },{
                            id: "ro-3",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-3.mp3", "ui/ro-3.ogg"]
                        },{
                            id: "ro-4",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-4.mp3", "ui/ro-4.ogg"]
                        },{
                            id: "ro-5",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-5.mp3", "ui/ro-5.ogg"]
                        },{
                            id: "ro-6",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-6.mp3", "ui/ro-6.ogg"]
                        },{
                            id: "ro-7",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-7.mp3", "ui/ro-7.ogg"]
                        },{
                            id: "ro-8",
                            loop: false,
                            preload: "auto",
                            group: "rollover",
                            sources: ["ui/ro-8.mp3", "ui/ro-8.ogg"]
                        },{
                            id: "page-forward",
                            loop: false,
                            preload: "auto",
                            group: "page",
                            sources: ["ui/page-forward.mp3", "ui/page-forward.ogg"]
                        },{
                            id: "page-back",
                            loop: false,
                            preload: "auto",
                            group: "page",
                            sources: ["ui/page-back.mp3", "ui/page-back.ogg"]
                        }
                    ]
                );
        }

        $(window).one("mousewheel mousedown touchstart", firstTouchPromise.resolve);

        $(window)
            .on('orientationchange', _.bind(this.onOrientationChange, this))
            .on('resize', _.bind(this.onResize, this));
        this.onOrientationChange();
        this.onResize();

        this.router.app = this;
        this.router.pages = pages;
        this.listenTo(this.router, 'route', this.onRoute);
        this.render();
        Backbone.history.start();
    },
    onOrientationChange: function (e) {
        // alert('onOrientationChange', window.orientation);
        if (Math.abs(window.orientation) == 90) {
            // landscape

        } else {
            //portrait

        }
    },
    onResize: function(){
        this.trigger("resize");
        if ($.browser.iphone && window.innerWidth < 600 && window.innerHeight < 600){
            // it's an iphone 5
            $html.addClass("iphone5");
        } else if ($.browser.iphone || $.browser.ipad && (window.innerWidth > 600 || window.innerHeight > 600)){
            $html.addClass("iphone6");
        } else if ($.browser.iphone || $.browser.ipad && (window.innerWidth > 600 || window.innerHeight > 600)){
            $html.addClass("ipad");
        }
        window.scrollTo(0,0);
        requestAnimationFrame(function(){
            window.scrollTo(0,1);
        });

        $("#hud .window-dimensions .message").text(window.innerWidth + "x" + window.innerHeight);
        $("body").css({
            height: window.innerHeight + 1,
            width: window.innerWidth,
        });
       
    }
});

var lastLoadType = "site";
function onloadStart(data){
    data = _.extend({
        type: lastLoadType,
        id: "#",
        silent: false
    }, data);
    lastLoadType = data.type;

    // console.log("LOAD START", data);

    switch(data.type){
        case "section":
            if (data.silent){
                overlays["#section-loader"].animateOut();
            } else {
                overlays["#section-loader"].animateIn();
            }
        break;
        case "site":
            overlays["#site-loader"].reset();
            overlays["#site-loader"].animateIn();
        break;
    }
    

}
function onloadProgress(data){
    data = _.extend({
        type: lastLoadType,
        id: "#",
        progress: 0,
        silent: false
    }, data);

    lastLoadType = data.type;
    // console.log("LOAD PROGRESS", data);
    
    switch(data.type){
        case "sub":
            overlays["#site-loader"].setSubProgress(data.progress, data.silent);
        break;
        case "site":
            overlays["#site-loader"].setProgress(data.progress, data.silent);
        break;
        case "section":
            // intentional fallthrough
        default:
            overlays["#section-loader"].setProgress(data.progress, data.silent);
        break;
    }

}
function onloadEnd(data){
    data = _.extend({
        type: lastLoadType,
        id: "#",
        silent: false
    }, data);
    lastLoadType = data.type;

    $html.removeClass("unloaded");

    // console.log("LOAD COMPLETE", data);
    
    switch(data.type){
        case "section":
            overlays["#section-loader"].animateOut();
        break;
        case "site":
            overlays["#site-loader"].animateOut();
        break;
    }
}
