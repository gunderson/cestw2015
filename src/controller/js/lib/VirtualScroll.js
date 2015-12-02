require("jquery");
require("backbone");
var VirtualScroll = function (name, easing) {

    var MULT = 2;
    var _this = this;
    name = name || "";
    easing = easing || 1;

    this.event = {
        scrollX: 0,
        scrollY: 0,

        targetScrollX: 0,
        targetScrollY: 0,

        deltaX: 0,
        deltaY: 0,

        maxDeltaX: 0,
        maxDeltaY: 0,

        ratioY: 0,
        ratioX:0,

        preventDefault: function(){}
    };

    _this.autoPilotMode = false;

    var lastPageX = 0;
    var lastPageY = 0;
    var attached = false;
    var startX, startY, targetX, targetY, duration, t;

    this.playing = true;

    this.play = function(){
        _this.playing = true;
        onFrame();
    };

    this.stop = function(){
        _this.playing = false;
    };

    var minX = null, maxX = null, totalDeltaY = null;
    var minY = null, maxY = null, totalDeltaX = null;

    this.limitX = function (min, max) {
        minX = min;
        maxX = max;
        totalDeltaX = maxY - minY;
    };

    this.limitY = function (min, max) {
        minY = min;
        maxY = max;
        totalDeltaY = maxY - minY;
    };

    this.reset = function () {
        _this.setValue(0, 0);
    };

    this.setValueRatio = function (x, y) {
        _this.setValue(minX + (x * (maxX - minX)), minY + (y * (maxY - minY)));
    };

    this.setValue = function (x, y) {
        _this.event.scrollX = x;
        _this.event.scrollY = y;

        _this.event.targetScrollX = x;
        _this.event.targetScrollY = y;

        _this.autoPilotMode = false;
        _dispatch();
    };

    this.scrollToRatio = function(x, y, d){
        _this.scrollTo(minX + (x * (maxX - minX)), minY + (y * (maxY - minY)), d);
    };

    this.scrollTo = function (x, y, d) {
        _this.autoPilotMode = true;

        startX = _this.event.scrollX;
        startY = _this.event.scrollY;

        _this.event.targetScrollX = x;
        _this.event.targetScrollY = y;

        // 30 frames = roughyl 0.5s by default (but it could be estimated based on distance-to-travel)
        // duration = d || 30;
        duration = (Math.abs(y - startY) / 50) >> 0;
        t = 0;
    };

    var autoScroll = function () {
        t++;
        var dx = (easeQuartInOut(startX, _this.event.targetScrollX, t / duration)) >> 0;
        var dy = (easeQuartInOut(startY, _this.event.targetScrollY, t / duration)) >> 0;
        _set(dx - _this.event.scrollX, dy - _this.event.scrollY);
        if (t >= duration) {
            _this.autoPilotMode = false;
            _dispatch();
        }
    };

    function easeQuartInOut(a,b,i){
        i = Math.min(1,Math.max(i,0));
        var delta = b-a;
        if (i < 0.5){
            i *= 2;
            return a + ((delta * 0.5) * i * i* i* i);
        } else {
            i = 1 - ((2 * i) - 1);
            return b - ((delta * 0.5) * i * i* i* i);
        }
    }

    var _set = function (dx, dy) {
        if (easing && !_this.autoPilotMode) {
            _this.event.targetScrollX += dx;
            _this.event.targetScrollY += dy;
        } else {
            _this.event.scrollX += dx;
            _this.event.scrollY += dy;
        }

        _this.event.maxDeltaX = Math.max(_this.event.maxDeltaX, Math.abs(dx));
        _this.event.maxDeltaY = Math.max(_this.event.maxDeltaY, Math.abs(dy));

        _this.event.deltaX = dx;
        _this.event.deltaY = dy;
    };

    // window.addWheelListener might wrap the callback function into another one, so keep a reference to it for removing the listener later...
    var onWheelCallback;

    var _dispatch = function () {

        if (minX !== null) {
            _this.event.scrollX = Math.max(minX, Math.min(maxX, _this.event.scrollX));
            _this.event.targetScrollX = Math.max(minX, Math.min(maxX, _this.event.targetScrollX));
            if (totalDeltaX !== null){
                _this.event.ratioX = (_this.event.scrollX + minX) / totalDeltaX;
            }
        }

        if (minY !== null) {
            _this.event.scrollY = Math.max(minY, Math.min(maxY, _this.event.scrollY));
            _this.event.targetScrollY = Math.max(minY, Math.min(maxY, _this.event.targetScrollY));
            if (totalDeltaY !== null){
                _this.event.ratioY = (_this.event.scrollY + minY) / totalDeltaY;
            }
        }


        // console.log(_this.event)

        // _this.dispatcher.dispatch(_this.event);
        $(window).trigger('vscroll', _this.event);
        app.trigger('vscroll', _this.event);
    };

    this.attach = function () {
        if (!this.attached){
            console.log("VirtualScroll attached");
            this.attached = true;
        } else {
            console.log("VirtualScroll already attached");
            return ;
        }
        if (window.ontouchstart) {

           /* document.addEventListener('touchstart', function (e) {
                lastPageX = 0;
                lastPageY = 0;
            }, false);

            document.addEventListener('touchmove', function (e) {
                e.preventDefault();

                if (_this.autoPilotMode) {
                    _this.autoPilotMode = false;
                }

                if (lastPageX !== 0) {
                    _set(
                        -(e.targetTouches[0].pageX - lastPageX) * 2,
                        -(e.targetTouches[0].pageY - lastPageY) * 2
                    );
                }

                lastPageX = e.targetTouches[0].pageX;
                lastPageY = e.targetTouches[0].pageY;

            }, false);*/
        } else {

            onWheelCallback = addWheelListener(document, function (e) {
                //fix for slow firefox scrolling
                // console.log("-- Scroll Report: "+ e.deltaY)
                var deltaY = e.deltaY;//(e.deltaY == e.deltaY >> 0) ? e.deltaY : e.deltaY * e.deltaY* e.deltaY;

                e.preventDefault();
                if (_this.autoPilotMode) {
                    _this.autoPilotMode = false;
                }
                _set(e.deltaX * MULT, deltaY * MULT);
            });
        }

        $(document).on('keydown', function(e){
            switch (e.keyCode){
                case 38:
                    //up arrow
                    _set(0, -100);
                    e.preventDefault();
                    break;
                case 40:
                    //down arrow
                    _set(0, 100);
                    e.preventDefault();
                    break;
            }
        });

        // FJ.FrameImpulse.addEventListener(onFrame);
        _this.play();
        return _this;
    };

    var detach = this.detach = function () {
        console.log("VirtualScroll detached")
        this.attached = false;
        // TODO: Add touch support
        _this.stop();
        $(document).off('keydown');
        removeWheelListener(document, onWheelCallback);
    };

    var onFrame = function () {
        if (_this.playing){
            var dx = ((_this.event.targetScrollX - _this.event.scrollX) * easing) >> 0;
            var dy = ((_this.event.targetScrollY - _this.event.scrollY) * easing) >> 0;
            if (_this.autoPilotMode) {
                autoScroll();
            } else if (easing) {
                _this.event.scrollX += dx;
                _this.event.scrollY += dy;
            }
            if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1){
                _dispatch();
            }
            window.requestAnimationFrame(onFrame);
        }
    };
};

module.exports = VirtualScroll;
