var _instance;


module.exports = (function(){
	if (_instance) return _instance;

	// logging function that can be disabled by setting the disabled property to true.
	window.trace = function(){
		if (!window.trace.disabled){
			console.log.call(window, arguments);
		}
	};
	window.trace.disabled = false;

	return window;
})(window);

