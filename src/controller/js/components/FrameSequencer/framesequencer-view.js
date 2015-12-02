var _ = require("underscore");
var $ = require("jquery");
var Backbone = require("backbone");

var alreadyActive = false;

var View = Backbone.Layout.extend({
	initialize: function() {
		$(window).on("resize", this.onResize);

		this.model.on("change:active", this.activate, this);

		this.setNewPosition = _.bind(setNewPosition, this);

		this.onMouseWheel = onMouseWheel.bind(this);
	},
	afterRender: function(){
		this.onResize();
		this.$el.parent().on('mousedown touchstart', onMouseDown.bind(this));
//		this.$el.parent().on('mousewheel', onMouseWheel.bind(this));
	},
	activate: function(timelinePosition, isActive) {
		console.log("onChangeActive", isActive);
		if (isActive === false){
			return this.deactivate();
		}


		console.log("ACTIVATE")
		if (this.model.get("numLoaded") < this.model.get("numImages")){

			console.log("Waiting to call onLoadComplete", this.model.get("numLoaded"), this.model.get("numImages"));
			this.model.once("loadComplete", function(){
				onLoadComplete.call(this, timelinePosition);
			}.bind(this));
		} else {
			console.log("Calling onLoadComplete immediately", this.model.get("numLoaded") , this.model.get("numImages"));
			onLoadComplete.call(this, timelinePosition);
		}
	},
	deactivate: function(){
		console.log("DEACTIVATE")
		alreadyActive = false;
		app.off("vscroll", this.onMouseWheel);
	},
	onResize: onResize,
	setNewPosition: setNewPosition
});

//----------------------------------------------

function onLoadComplete(timelinePosition){
	console.log("onLoadComplete");
	var _this = this;
	this.model.get('frames').each(function(frame){
		_this.$el.append(frame.get('$img'));
	});
	this.model.set("timelinePosition", timelinePosition);


	if (alreadyActive){
		return;
	} else {
		alreadyActive = true;
	}
	app.on("vscroll", this.onMouseWheel);
}

//----------------------------------------------

var prevX = 0;

function onMouseDown(e){
	e.preventDefault();
	e.stopImmediatePropagation();

	this.$el.parent().on("mousemove touchmove", onMouseMove.bind(this));
	this.$el.parent().on("mouseup touchend mouseleave", onMouseUp.bind(this));

	var pageX = e.pageX || e.originalEvent.pageX || e.originalEvent.touches[0].pageX;

	prevX = -pageX / window.innerWidth;
}

function onMouseMove(e){

	e.preventDefault();
	e.stopImmediatePropagation();



	var pageX = e.pageX || e.originalEvent.pageX || e.originalEvent.touches[0].pageX;

	var newX = -(pageX / window.innerWidth);
	var deltaX = 0.5 * (newX - prevX);
	prevX = newX;
	setNewPosition.call(this, deltaX);
	return this;
}

function setNewPosition(delta){
	var view = this;
	var oldPosition = this.model.get("timelinePosition");
	var newPosition = oldPosition + delta;

	if (newPosition >= 1) {
		onMouseUp.call(this);
		// listen to change:currentFrame
		if(this.model.get("currentFrame") === this.model.get("numImages") - 1){
				view.trigger("sequenceComplete:end");
				view.stopListening(this.model, "change:currentFrame");
		} else {
			this.listenTo(this.model, "change:currentFrame", function(model, val){
				// when currentFrame >= numImages
				if (model.get("currentFrame") >= model.get("numImages")-1){
					// trigger an event and stop listening
					//advance to next scene
					view.trigger("sequenceComplete:end");
					view.stopListening(model, "change:currentFrame");
				}
				
			});
		}
		newPosition = 1;
	} else if (newPosition <= 0){
		onMouseUp.call(this);
		if(this.model.get("currentFrame") === 0){
				view.trigger("sequenceComplete:start");
				view.stopListening(this.model, "change:currentFrame");
		} else {
			// listen to change:currentFrame
			this.listenTo(this.model, "change:currentFrame", function(model, val){
				// when currentFrame >= numImages
				if (model.get("currentFrame") <= 0){
					// trigger an event and stop listening
					//go back a scene
					view.trigger("sequenceComplete:start");
					view.stopListening(model, "change:currentFrame");
				}
				
			});
		}
		newPosition = 0;
	}

	this.model.set({
		timelinePosition: newPosition
	});
}

function onMouseUp(){
	this.$el.parent().off("mousemove touchmove mouseup touchend mouseleave");
}

//----------------------------------------------

function onMouseWheel(e){
	// e.preventDefault();
	// e.stopImmediatePropagation();
	setNewPosition.call(this, 0.0001 * (-e.deltaY + e.deltaX));
}



//----------------------------------------------

function onResize(){
	
}

module.exports = View;