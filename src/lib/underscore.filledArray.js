if (_){
	_.mixin({
		"filledArray": function(length, value){
			length = length || 0;
			value = value || 0;
			var a = [];
			while(length--){
				a.push(value);
			}
			return a;
		}
	});
}
