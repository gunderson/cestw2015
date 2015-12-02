var HeaderUtils = require("./HeaderUtils");

module.exports = {
	response: null,
	sendData: function (response, data){
		HeaderUtils.addJSONHeader(response);
		HeaderUtils.addCORSHeader(response);
		response.send(JSON.stringify(data, null, "\t") + "\n");
	}
};