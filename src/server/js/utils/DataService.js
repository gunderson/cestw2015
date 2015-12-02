module.exports = {
	setAsJSON :function(res){
		res.set("content-type", "application/json");
		return res;
	}
};