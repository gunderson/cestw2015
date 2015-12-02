var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser');
var _ = require("underscore");
var inspect = require('eyespect').inspector();
var request = require("request");
var HeaderUtils = require("./utils/HeaderUtils");

var options = {};

module.exports = function(app, server, _options) {

	options = _.extend(options, {
		serverTimeout: 10000,
		env: "dev",
		CZ_KEY: "1234qwer",
		CZ_SERVER: "http://dxpapidemo.creativezing.com/api" // DEV
		// CZ_SERVER: "https://dxpapi.creativezing.com/api" // prod
	}, _options);

	router = express.Router();

	router.use(bodyParser.json());
	router.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept");
		res.header("Connection: close");
		res.header("Proof: close");
		res.header("Access-Control-Allow-Methods", "GET, POST");
		next();
	});


	/**********************************************************
	 *
	 * Params for dynamic urls
	 *
	 **********************************************************/

	/*router.param('since', function(req, res, next, since){
		req.since = since;
		next();
	});*/


	/**********************************************************
	 *
	 * Routes
	 *
	 **********************************************************/

	router.post("/", function(req, res, next) {
		// log the incoming request

		//insert key
		var incoming = JSON.parse(req.params.vote);
		//validate the incoming data

		var vote = {
			Contact: {
				"Misc1": incoming.zip,
				"Mist2": req.connection.remoteAddress
			},
			S: {z: options.CZ_KEY}
		};
		// forward request to var url = 'https://www.example.com'
		var postOptions = {
			method: 'post',
			body: postData,
			json: true,
			url: options.CZ_SERVER
		};

		request(postOptions, function (err, apires, body) {
			if (err) {
				inspect(err, 'error posting json');
				return;
			}
			var headers = apires.headers;
			var statusCode = apires.statusCode;
			HeaderUtils.addJSONHeader(res);
			res.write(JSON.stringify({"status": 200}));
			res.end();
		});
	});

	router.get("/", function(req, res, next){
		HeaderUtils.addJSONHeader(res);
		res.write(JSON.stringify({"status": 200}));
		res.end();
	});

	app.use('/', router);

};


function closeConnection(socket) {
	// force a short timeout on client connections so we can cycle the server quickly
	socket.setTimeout(options.serverTimeout);
}
