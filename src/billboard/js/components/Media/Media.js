var _ = require("underscore");
var $ = require("jquery");
require("backbone");
var Howler = require("howler").Howler;
var Howl = require("howler").Howl;
require("gsap");

if (window.ontouchstart){
	Howler.iOSAutoEnable = false;
}

var Media = {
	Collections: {},
	Models: {},
};

Media.CuePoint = Backbone.Model.extend({
	defaults:{
		event: "cue_point",
		data: {},
		start_time: 0,
		end_time: 0,
		triggered: false
	}
});

Media.CuePoints = Backbone.Collection.extend({
	model: Media.CuePoint
});

Media.Models.Abstract = Backbone.Model.extend({
	defaults: {
		sources: [],
		group: null,
		controls: false,
		autoplay: false,
		volume: 1,
		muted: false,
		loop: false,
		playing: false,
		initPlay: true,
		preload: "auto",
		poster: null,
		mediaType: "",
		mediaSize: 720,
		mediaRoot: "./",
		canplay: false,
		cuePoints: null,
		cuePointPoller: null,
		hasSound: true
	},
	initialize: function(){
		var cues = this.get('cuePoints');
		var cuepoints = new Media.CuePoints(cues);
		this.set('cuePoints', cuepoints);
		var $el = this.get('$el');

		//event listeners
		$el.on('ended', _.bind(this.onComplete, this));
		$el.on('play', _.bind(this.onPlay, this));
		$el.on('pause', _.bind(this.onPause, this));
		$el.on('canplaythrough', _.bind(this.onCanPlay, this));
		$el.on('loaded', _.bind(this.onCanPlay, this)); // if $el is an image
		$el.on('progress', _.bind(this.onProgress, this));
		this.on('change:mediaRoot', this.changeMediaSize, this);
		this.on('change:volume', this.setVolume, this);
		this.on('change:muted', this.setMuted, this);

		// console.log("Media Object", this.get("sources"))

		_.each(this.get("sources"), _.bind(function(filename, i, sources){
			this.addSource(filename);
		}, this));

		
		// setup media element
		_.extend($el[0],{
			controls: this.get('controls'),
			autoplay: this.get('autoplay'),
			loop: this.get('loop'),
			preload: this.get('preload'),
			poster: this.get('poster'),
			volume: this.get('volume'),
		});


		this.checkCuePoints = _.bind(this.checkCuePoints, this);

	},
	onPlay: function(){
		this.trigger('play');
		this.set('playing', true);
		if (this.get("cuePoints")){
			this.startCuePointChecker();
		}
	},
	onPause: function(){
		this.trigger('pause');
		this.set('playing', false);
		if (this.get("cuePoints")){
			this.stopCuePointChecker();
		}
	},
	onCanPlay: function(){
		this.trigger('canplay');
		this.set('canplay',true);
		// console.log('--- object onCanPlay', this.get('canplay'), this.get('sources')[0]);
	},
	onProgress: function(e){
		try{
			var myVideo = e.currentTarget;
			var endBuf = myVideo.buffered.end(0);
			var soFar = endBuf / myVideo.duration;
			this.trigger('progress', soFar);
		} catch (er){
			this.trigger('progress', 0);
		}
	},
	onComplete: function(){
		this.trigger('complete');
		this.set('playing', false);
		this.stopCuePointChecker();
		this.resetCuePoints();
		// console.log("*** Media: ", this.get('id'), "complete");
	},
	changeMediaSize: function(obj, val){
		if (val === null) return;
		var $el = this.get('$el'),
			el = $el[0];

		this.get('$el').find('source').each(function(){
			$(this).remove();
		});

		_.each(this.get("sources"), _.bind(function(filename, i, sources){
			this.addSource(filename);
		}, this));

		if (!el.paused){
			try{
				el.load();
				this.play(el.currentTime);
			} catch(e){}
		}
	},
	play: function(from){
		var _this = this;
		try{
			var el = this.get('$el')[0];
			if (from) el.currentTime = from;
			el.play();


		} catch(e){
			setTimeout(function(){
				_this.trigger('complete');
			}, 4);
		}
		return this;
	},
	pause: function(){
		try{
			this.set('playing', false);
			var el = this.get('$el')[0];
			el.pause();
			// this.stopCuePointChecker();
		} catch(e){}
		return this;
	},
	togglePlay: function(){
		if (this.get('playing')){
			this.pause();
		} else {
			this.play();
		}
	},
	currentTime: function(from){
		try{
			var el = this.get('$el')[0];
			if (from) {
				el.currentTime = from;
				return from;
			} else {
				return el.currentTime;
			}
		} catch(e){}
		return this;
	},
	setVolume: function(obj, val){
		try{
			this.get('$el')[0].volume = val;
		} catch(e){}
		return this;
	},
	setMuted: function(obj, val){
		try{
			this.get('$el')[0].muted = val;
		} catch(e){}
		return this;
	},
	startCuePointChecker: function(){
		// console.log('startCuePointChecker')
		// console.log("cues",cues);
		var cues = this.get('cuePoints');

		if (cues){
			this.cuePointPoller = setInterval(this.checkCuePoints, 100);
		}
	},
	stopCuePointChecker: function(){
		// console.log('stopCuePointChecker')
		if (this.cuePointPoller) clearInterval(this.cuePointPoller);
	},
	checkCuePoints: function(){
		var cues = this.get('cuePoints'),
			$el = this.get('$el'),
			currentTime = this.currentTime();

		var startTriggers = cues.filter(function(cue){
			return cue.get('start_time') < currentTime && cue.get('end_time') > currentTime && !cue.get('triggered');
		});
		var endTriggers = cues.filter(function(cue){
			return cue.get('end_time') < currentTime && cue.get('triggered');
		});
		var _this = this;
		_.each(startTriggers, function(cue){
			// console.log("startCue:" + cue.get('event'))
			_this.trigger('startCue:' + cue.get('event'), cue.get('data'));
			// console.log("'startCue:' + cue.get('event'), cue.get('data')",'startCue:' + cue.get('event'), cue.get('data'));

			cue.set('triggered', true);
		});

		_.each(endTriggers, function(cue){
			// console.log("endCue:" + cue.get('event'))
			_this.trigger("endCue:" + cue.get('event'), cue.get('data'));
			cue.set('triggered', false);
		});
		cues.prevTime = currentTime;
	},
	resetCuePoints: function(){
		this.get('cuePoints').each(function(cue){
			cue.set('triggered', false);
			return ;
		});
	},
	addSource: function(filename){
		try{
			var $el = this.get('$el');
			$el.append(this.makeSource(filename));
			$el[0].load();
		} catch(e){}
		return this;
	},
	makeSource: function(filename){
		var ext = filename.split(".").pop().toLowerCase();
		return $("<source>")
			.attr({
				src: this.get("mediaRoot") + filename,
				id: filename.split(".").join("-")
			});
	},
	dispose: function(){
		this.get('$el').empty().remove();
	}
});

Media.Models.Image = Media.Models.Abstract.extend({
	defaults: _.extend({},
		{
			mediaType: "image",
			preload: "auto"
		},
		Media.Models.Abstract.prototype.defaults
	),
	initialize: function(){
		var $el = $("<img>");
		this.set('$el', $el);
		$el[0].onload  = _.bind(function(){
			this.set("canplay", true);
		}, this);
		// this.on('change:mediaSize', this.changeMediaSize, this);
		Media.Models.Abstract.prototype.initialize.call(this);
	},
	addSource: function(filename){
		// console.log("addSource",filename);

		var $el = this.get("$el");
		//if it's an absolute address, use it.
		//otherwise assume the front-end is taking care of selecting the path
		var src = (filename.indexOf("http") > -1) ? filename : filename;
		return $el
			.attr({
				src: src,
				id: this.get("id")
			});
	}
});

Media.Models.Audio = Media.Models.Abstract.extend({
	defaults: _.extend({},
		{
			mediaType: "audio"
		},
		Media.Models.Abstract.prototype.defaults
	),
	initialize: function(){
		var cues = this.get('cuePoints');
		var cuepoints = new Media.CuePoints(cues);
		this.baseVolume = this.get("volume");
		this.set({
			'cuePoints': cuepoints,
			'mediaRoot': this.collection.controller.get("audioRoot")
		});

		var h = new Howl({
			urls: _.map(this.get("sources"), function(s){
				return this.get("mediaRoot") + s;
			}.bind(this)),
			loop: this.get("loop"),
			volume: this.get("volume"),
			onload:  _.bind(this.onCanPlay, this),
			onend:   _.bind(this.onComplete, this),
			onpause: _.bind(this.onPause, this),
			onplay:  _.bind(this.onPlay, this)
		});

		this.set("howl", h);
		this.on('change:volume', this.setVolume, this);
		this.on('change:muted', this.setMuted, this);
		this.checkCuePoints = _.bind(this.checkCuePoints, this);

	},
	onPlay: function(){
		this.trigger('play');
		this.set('playing', true);
		if (this.get("cuePoints").length){
			this.startCuePointChecker();
		}
	},
	onPause: function(){
		this.trigger('pause');
		this.set('playing', false);
		if (this.get("cuePoints").length){
			this.stopCuePointChecker();
		}
	},
	onCanPlay: function(){
		this.trigger('canplay');
		this.set('canplay',true);
		// console.log('--- object onCanPlay', this.get('canplay'), this.get('sources')[0]);
	},
	play: function(from){
		var _this = this;
		try{
			var h = this.get('howl');
			if (from) this.currentTime(from);
			h.play();
		} catch(e){
			console.error(e);
			setTimeout(function(){
				_this.trigger('complete');
			}, 4);
		}
		console.log("PlaySound: ", this.id);
		return this;
	},
	pause: function(){
		try{
			this.set('playing', false);
			var h = this.get('howl');
			h.pause();
		} catch(e){}
		return this;
	},
	currentTime: function(from){
		try{
			var h = this.get('howl');
			if (from || from === 0) {
				h.pos(from);
				return from;
			} else {
				return h.pos();
			}
		} catch(e){}
		return this;
	},
	setVolume: function(obj, val){
		try{
			this.get('howl').volume = val;
		} catch(e){}
		return this;
	},
	setMuted: function(obj, val){
		try{
			if (val){
				this.get('howl').mute();
			} else {
				this.get('howl').unmute();
			}
		} catch(e){}
		return this;
	},
});

/*
Media.Models.Audio = Media.Models.Abstract.extend({
	defaults: _.extend({},
		{
			mediaType: "audio"
		},
		Media.Models.Abstract.prototype.defaults
	),
	initialize: function(){
		var $el = $("<audio>");
		this.set('$el', $el);
		// this.on('change:mediaSize', this.changeMediaSize, this);
		Media.Models.Abstract.prototype.initialize.call(this);
	},
	makeSource: function(filename){
		var ext = filename.split(".").pop().toLowerCase(),
			mimeType,
			$source;
		switch (ext) {
			case "mp1":
			case "mp2":
			case "mp3":
			case "mpg":
			case "mpeg":
				mimeType = "audio/mpeg";
				break;
			case "mp4":
			case "m4a":
				mimeType = "audio/mp4";
				break;
			case "ogg":
			case "oga":
				mimeType = "audio/ogg";
				break;
			case "aac":
				mimeType = "audio/aac";
				break;
			case "wav":
				mimeType = "audio/wav";
				break;
			case "webm":
				mimeType = "audio/webm";
				break;
			default:
				mimeType = null;
		}
		//if it's an absolute address, use it.
		//otherwise assume the front-end is taking care of selecting the path
		var src = (filename.indexOf("http") > -1) ? filename : this.get("mediaRoot") + filename;
		return $("<source>")
			.attr({
				type: mimeType,
				src: src,
				id: filename.split(".").join("-")
			});
	}
});*/

Media.Models.Video = Media.Models.Abstract.extend({
	defaults: _.extend({},
		{
			mediaType: "video"
		},
		Media.Models.Abstract.prototype.defaults
	),
	initialize: function(){
		var white_1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=";
		var $el;
		$el = $("<video>");
		this.set('$el', $el);
		Media.Models.Abstract.prototype.initialize.call(this);
	},
	makeSource: function(filename){
		var ext = filename.split(".").pop().toLowerCase(),
			mimeType,
			$source;
		switch (ext) {
			case "webm":
				mimeType = "video/webm";
				break;
			case "mp4":
			case "m4v":
				mimeType = "video/mp4";
				break;
			case "mpg":
			case "mpeg":
				mimeType = "video/mpeg";
				break;
			case "ogg":
			case "ogv":
				mimeType = "video/ogg";
				break;
			case "wmv":
				mimeType = "video/x-ms-wmv";
				break;
			case "mov":
				mimeType = "video/quicktime";
				break;
			case "mkv":
				mimeType = "video/x-matroska";
				break;
			case "3gp":
				mimeType = "video/3gpp";
				break;
			case "avi":
				mimeType = "video/avi";
				break;
			case "flv":
				mimeType = "video/x-flv";
				break;
			default:
				mimeType = null;
		}
		//if it's an absolute address, use it.
		//otherwise assume the front-end is taking care of selecting the path
		var src = (filename.indexOf("http") > -1) ? filename : this.get("mediaRoot") + this.get("mediaSize") +"/" + filename;

		return $("<source>")
			.attr({
				type: mimeType,
				src: src,
				id: filename.split(".").join("-")
			});
	}
});

Media.Collections.Abstract = Backbone.Collection.extend({
	initialize: function(){
		this.on('add', this.onAdd, this);
		this.on('remove', this.onRemove, this);
		this.on('change:canplay', this.onCanPlay, this);
	},
	setController: function(controller){
		this.controller = controller;
		controller.on('change:volume', this.setVolume, this);
		controller.on('change:muted', this.setMuted, this);
		return this;
	},
	onAdd: function(obj){
		obj.set({
			// volume: this.controller.get('volume'),
			muted: this.controller.get('muted'),
			mediaSize: this.controller.get('mediaSize')
		});
		return this;
	},
	onRemove: function(obj){
		// console.log(obj);
		obj.dispose();
	},
	onCanPlay: function(obj){
		if (this.isReady()){
			this.trigger("all:ready");
		}

		this.trigger("all:loadProgress", {
			total: this.where({preload: "auto"}).length,
			loaded: this.where({canplay: true}).length,
			percent: this.where({canplay: true}).length / this.where({preload: "auto"}).length
		});

		// TODO: abstract this to be more general for groups and non-groups
		if (obj.get("group")){
			if (this.isReady(obj.get("group"))){
				this.trigger(obj.get("group") + ":ready");
			}
		}
	},
	setVolume: function(obj, val){
		this.each(function(media, i){
			media.set('volume', val);
		});
		return this;
	},
	setMuted: function(obj, val){
		this.each(function(media, i){
			media.set('muted', val);
		});
		return this;
	},
	setMediaRoot: function(obj, val){
		this.each(function(media, i){
			media.set('mediaRoot', val);
		});
	},
	setMediaSize: function(obj, val){
		this.each(function(media, i){
			media.set('mediaSize', val);
		});
	},
	pauseAll: function(){
		this.each(function(media, i){
			media.pause();
		});
	},
	isReady: function(group){
		var search = {
			canplay: true
		};
		if (group){
			search.group = group;
			return this.where(search).length === this.where({group:group}).length;
		} else {
			return this.where(search).length === this.length;
		}
	}
});

Media.Images = Media.Collections.Abstract.extend({
	model: Media.Models.Image,
	onAdd: function(obj){
		Media.Collections.Abstract.prototype.onAdd.apply(this, arguments);
		obj.set({
			mediaRoot: this.controller.get('imageRoot')
		});
		return this;
	}
});

Media.Sounds = Media.Collections.Abstract.extend({
	model: Media.Models.Audio,
	mobileInit: function(){
		this.each(function(){
			if (this.get("playing")){
				this.play();
			} else {
				this.play().pause();
			}
		});
	},
	onAdd: function(obj){
		Media.Collections.Abstract.prototype.onAdd.apply(this, arguments);
		obj.set({
			mediaRoot: this.controller.get('audioRoot')
		});
		return this;
	}
});

Media.Videos = Media.Collections.Abstract.extend({
	model: Media.Models.Video,
	onAdd: function(obj){
		Media.Collections.Abstract.prototype.onAdd.apply(this, arguments);
		obj.set({
			mediaRoot: this.controller.get('videoRoot')
		});
		return this;
	}
});


Media.Controller = Backbone.Model.extend({
	defaults: {
		sounds: null,
		videos: null,
		volume: 1,
		muted: false,
		videoRoot: "vid/",
		audioRoot: "snd/",
		imgRoot: "img/",
		mediaSize: 854,
	},
	initialize: function(){
		var videos = new Media.Videos().setController(this);
		var sounds = new Media.Sounds().setController(this);
		var images = new Media.Images().setController(this);
		this.set('videos', videos);
		this.set('sounds', sounds);
		this.set('images', images);
		this.on('change:volume', this.onSetVolume, this);
		this.on('change:muted', this.onSetMuted, this);
		this.on('change:mediaSize', this.onChangeMediaSize, this);
		this.on('change:mediaSize', videos.setMediaSize, videos);
		this.on('change:videoRoot', videos.setMediaRoot, videos);
		this.on('change:audioRoot', sounds.setMediaRoot, sounds);
		this.on('change:imageRoot', images.setMediaRoot, images);
		this.playSound  = _.bind(this.playSound, this);
		this.mute       = _.bind(this.mute, this);
		this.unMute     = _.bind(this.unMute, this);
		this.toggleMute = _.bind(this.toggleMute, this);

		this.listenTo(videos, "change:canplay", this.onCanPlay);
		this.listenTo(sounds, "change:canplay", this.onCanPlay);
	},
	onCanPlay:function(obj, val){
		var videos = this.get('videos'),
			sounds = this.get('sounds'),
			total = videos.where({preload:"auto"}).length + sounds.where({preload:"auto"}).length,
			readyNum = videos.where({canplay: true, preload:"auto"}).length + sounds.where({canplay: true, preload:"auto"}).length;
		if (readyNum >= total){
			this.trigger("canplay");
			// console.log("color:#69f",["*** Media: ","Can Play", readyNum + " of " + total]);
		} else {
			this.trigger("progress", {percentComplete: readyNum / total});
			// console.log("color:#69f",["*** Media: ","progress", readyNum / total]);
		}
	},

	/**********************************************************/
	// Play Controls
	/**********************************************************/

	// pass in the sound id to play
	// if you pass a group, it will choose one from the group at random
	playSound: function(id,from,fadeUp, duration){
		// make "from" optional
		if (from === true || from === false){
			fadeUp = from;
			duration = fadeUp;
			from = 0;
		}
		duration = duration || 1;
		var sound = this.get('sounds').get(id);
		if (!sound){
			sound = this.get('sounds').where({group:id});
			if (sound.length){
				sound = sound[Math.floor(Math.random() * sound.length)];
			} else {
				console.warn("The object", id, "is undefined");
				return this;
			}
		}

		if (from) sound.currentTime(from);
		if (fadeUp) {
			sound.volume = sound.get("volume");
			TweenMax.to(sound, duration, {
				volume: sound.baseVolume,
				overwrite: true,
				onUpdate: function(){
					sound.set("volume", sound.volume);
				}
			});
		} else {
			sound.set("volume", sound.baseVolume);
		}
		sound.play();
		return this;
	},
	playVideo: function(id,from){
		var vid = this.get('videos').get(id);
		if (vid.get('canplay')){
			this.doPlayVideo(vid, from);
		} else {
			vid.get('$el')[0].preload = "auto";
			this.listenToOnce(vid, "change:canplay", function(){
				this.doPlayVideo(vid, from);
			});
		}
		return this;
	},
	doPlayVideo: function(vid,from){
		if (from) vid.seekTo(from);
		vid.play();
	},
	pauseVideo: function(id){
		var vid = this.get('videos').get(id);
		vid.pause();
		return this;
	},
	pauseAllVideo: function(id){
		this.get('videos').each(function(vid){
			vid.pause();
		});
		return this;
	},
	pauseSound: function(id, fadeOut, duration){
		var group = this.get('sounds').where({group:id});
		if (group.length){
			_.each(group, function(sound){
				sound.pause();
			});
		} else {
			var sound = this.get('sounds').get(id);
			if (!sound) return this;
			if (fadeOut) {
				sound.volume = sound.get("volume");
				TweenMax.to(sound, duration, {
					volume: 0,
					overwrite: true,
					onUpdate: function(){
						sound.set("volume", sound.volume);
						console.log(sound.get("volume"));
					},
					onComplete: function(){
						sound.pause();
					}
				});
			} else {
				sound.pause();
			}


		}
		return this;
	},
	pauseAllSound: function(id){
		this.get('sounds').each(function(aud){
			aud.pause();
		});
		return this;
	},

	/**********************************************************/
	// Volume Controls
	/**********************************************************/

	mute: function(id){
		if (id){
			this.get('sounds').get(id).set('muted', true);
			this.get('videos').get(id).set('muted', true);
		} else {
			this.set({
				'muted': true
			});
		}
		return this;
	},
	unMute: function(id){
		if (id){
			this.get('sounds').get(id).set('muted', false);
			this.get('videos').get(id).set('muted', false);
		} else {
			this.set({
				'muted': false
			});
		}
		return this;
	},
	onSetVolume: function(obj, val){
		if (val === 0){
			this.set('muted', true);
		} else {
			this.set('muted', false);
		}

		
	},
	onSetMuted: function(obj, val){
		if (val){
			Howler.mute();
		} else {
			Howler.unmute();
		}
	},
	toggleMute: function(){
		var muted = this.get('muted');
		if (muted){
			this.unMute();
		} else {
			this.mute();
		}
		return this;
	}
});

module.exports = Media;