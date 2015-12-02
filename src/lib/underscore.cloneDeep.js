if (_){
	_.mixin({
	  "cloneDeep": function(obj){
	    return JSON.parse(JSON.stringify(obj));
	  }
	});
}