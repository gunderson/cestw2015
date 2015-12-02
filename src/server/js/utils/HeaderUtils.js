module.exports = {
	addJSONHeader :function(res){
		res.setHeader("content-type", "application/json");
		return res;
	},
	addCORSHeader: function(res){
	    res.setHeader("Access-Control-Allow-Origin", "*");
		return res;
	},
	// when: unix epoch timestamp
	// if isrelative is included then when is seconds from now
	addExpiresHeader:function(when, isrelative, res){
		//allow only 2 arguments
		if (typeof res === "undefined") {
			res = isrelative;
		} else if (isrelative === true){
			when += Date.now();
		}
		res.setHeader("Expires", new Date(when).toUTCString());
		return res;
	}
};