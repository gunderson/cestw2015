var constants = require("constants")[environment];

var SocialService = {

	// this should only be used for main site share
	shareFacebook: function (options) {
		// console.log('shareFacebook', options);
		options = _.extend({
			url: location.href,

		}, options);
		var site = encodeURIComponent(options.url);

		var shareURL = 'http://www.facebook.com/sharer.php?u=' + site ;
		openWindow(shareURL, 'Facebook');
	},


	shareGooglePlus: function (options) {
		// console.log('shareGooglePlus', options);
		options = _.extend({
			url: location.href,
		}, options);
		var site = encodeURIComponent(options.url);

		var shareURL = 'https://plus.google.com/share?url=' + site ;
		openWindow(shareURL, 'GooglePlus');
	},

	// shareFacebookDynamic: function (options) {
	// 	var title = 'title=' + encodeURIComponent(options.title);
	// 	var message = 'description=' + encodeURIComponent(options.message);
	// 	var img = 'img=' + encodeURIComponent(options.img);
	// 	var redirURL = 'redirectURL=' + encodeURIComponent(options.redirectURL);
	// 	var params = [redirURL, title, message, img];

	// 	// generic share url
	// 	var shareUrl = constants.site_root + 'share?' + params.join('&');

	// 	//    console.log(params);
	// 	console.log(shareUrl);
	// 	SocialService.shareFacebook({
	// 		url: shareUrl
	// 	});
	// },

	shareTwitter: function (options) {
		// console.log('shareTwitter', options);
		options = _.extend({
			url: '',
			message: undefined,
		}, options);

		if( options.url.length + options.message.length > 140){
			console.warn("tweet characters >140: ", options.url.length + options.message.length);
		}

		var message = encodeURIComponent(options.message);
		var shareURL;
		if (options.url.length > 1){
			var site = encodeURIComponent(options.url);
			shareURL = 'http://twitter.com/share?text=' + message + '&url=' + site;
		}else{
			shareURL = 'http://twitter.com/share?text=' + message;
		}
		openWindow(shareURL, 'Twitter');
	},

	shareTumblr: function (options) {
		// console.log('shareTumblr', options);
		options = _.extend({
			img: "",
			url: window.location.href,
			title: undefined,
			message: "",
		}, options);

		//var site = '&u=' + encodeURIComponent(options.url);
		//var title = options.title ? '&t=' + encodeURIComponent(options.title) : '';
		//var shareURL = 'http://tumblr.com/share?s=&v=3' + title + site;
		// var site =  encodeURIComponent(options.url);
		var site =  encodeURIComponent(options.url);
		var photo = encodeURIComponent(options.img);
		var title =  encodeURIComponent(options.title);
		var message =  encodeURIComponent(options.message);
		var shareURL_p = "//www.tumblr.com/share/photo?source=" + photo + "&caption=" + message + "&click_thru=" + site;
		// var shareURL= 'http://www.tumblr.com/share/link?url=' + site + '&name=' + title + '&description='+ desc;
	   
		openWindow(shareURL_p, 'Tumblr');
	},

	sharePinterest: function (options) {
		console.log('sharePinterest', options);
		options = _.extend({
			url: window.location.href,
			message: undefined,
			media: undefined,
			isVideo: false
		}, options);

//            img = 'http://media.giphy.com/media/iP8hhgIczK56U/giphy.gif';
		var media = options.media ? '&media=' + encodeURIComponent(options.media) : '';
		var isVideo = options.isVideo ? '&isVideo=true' : '';
		var site = encodeURIComponent(options.url);
		var message = options.message ? '&description=' + encodeURIComponent(options.message) : '';
		var shareURL = 'http://pinterest.com/pin/create/button/?url=' + site + message + media + isVideo;
		openWindow(shareURL, 'Pinterest');
	},

};

function openWindow(url, title) {
	// console.log('openWindow', url, title);
	var width = 575,
		height = 425,
		opts =
			',width=' + width +
			',height=' + height;
	window.open(url, title, opts);
}

module.exports = SocialService;