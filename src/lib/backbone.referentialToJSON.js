require("backbone");
require("underscore");

Backbone.Model.prototype.referentiate = function(){
	var output = {};
	_.each(this.attributes, function(attribute, key){
		if (attribute.attributes || attribute.models){
			// it's a model or collection, recurse creating json of models
			output[key] = attribute.referentiate();
		} else {
			output[key] = attribute;
		}

	});	
	return output;
};

Backbone.Collection.prototype.referentiate = function(){
	var output = [];
	_.each(this.models, function(model){
		output.push(model.referentiate());
	});
	return output;
};