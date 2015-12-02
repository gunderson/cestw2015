<?php
ini_set('display_errors', 0);
// error_reporting(E_NONE);
require_once("api_functions.php");
date_default_timezone_set("America/Los_Angeles");
define("DATA_CACHE_TTL", 525600 * 60);// 1 year from last post
define("DOMINOS_API_URL", "https://pizza.dominos.com/session/search.json");
define("ZING_KEY", "key-645LnmJ87mcnKjdv897");
define("ZING_API_URL", "http://dxpapidemo.creativezing.com/api");
// define("ZING_API_URL", "https://dxpapi.creativezing.com/api");

$now = time();

if(isset($_REQUEST["method"])){
	$method = $_REQUEST["method"];
} else if (!isset($method)){
	$method = null;
	echo "{\"success\":false,\"message\":\"method not set.\"}";
	die;
}

if(isset($_REQUEST["format"])){
	$format = $_REQUEST["format"];
} else if (!isset($format)){
	$format = "json";
}


switch ($method) {
	case 'dxp_stores':

		/*

		http://localhost:3031/api.php?method=dxp_stores&zipcode=90404
		
		*/
		requireParam("zipcode", $method);
		echoFormattedAs(dxpStores($_REQUEST["zipcode"]), $format);
		exit(0);
		break;
	case 'dxp_vote':

		/*

		http://localhost:3031/api.php?method=dxp_vote&store_id=7842&opt_in=true&email=pat@theorigin.net
		
		*/

		requireParam("opt_in", $method);
		requireParam("store_id", $method);
		requireParam("email", $method);
		echoFormattedAs(dxpVote($_REQUEST["store_id"], $_REQUEST["email"], $_REQUEST["opt_in"]), $format);
		exit(0);
		break;
	default:
		echo "{\"success\":false,\"message\":\"method '$method' does not exist.\"}";
		exit(1);
		break;
}

function dxpStores($zipcode){


	// ---------------- get lat-long
	// read lat-long index file
	// find zipdcode lat-long

	$dxp_store_list = json_decode(file_get_contents("data/dxp-store-list.json"));
	$latlong_list = json_decode(file_get_contents("data/zipcode-latlong.json"), TRUE);


	if (!array_key_exists($zipcode,$latlong_list)){
		$fail = array(
				"success" => false,
				"message" => "Invalid zip"
			);
		return $fail;
	}



	// ---------------- try to retreive from cache
	
	$dominos_data_file = openJSONFile("data/zips/" . $zipcode . ".json");
	if (sizeof($dominos_data_file->result_obj) > 0){
		if (time() - strtotime($dominos_data_file->result_obj->cached) > DATA_CACHE_TTL){
			// timed out
		} else {
			return $dominos_data_file->result_obj;
		}
	}
	

	$ziplatlong =  $latlong_list[$zipcode];


	// ---------------- get stores at lat-long
	// curl dominos api
	// curl "'https://pizza.dominos.com/session/search.json?latitude=34.029303&longitude=-118.406204' -H 'Pragma: no-cache' -H 'Accept: application/json, text/javascript, */*; q=0.01' -H 'Cache-Control: no-cache' --compressed"
	$DOMINOS_API_URL = DOMINOS_API_URL . "?latitude=$ziplatlong[0]&longitude=$ziplatlong[1]";

	$ch = curl_init( $DOMINOS_API_URL );
	
	// Configuring curl options
	$options = array(
		CURLOPT_RETURNTRANSFER => TRUE
	);
	
	// Setting curl options
	curl_setopt_array( $ch, $options );
	
	// Getting results
	$dominos_data =  json_decode(curl_exec($ch)); // Getting jSON result string

	// ---------------- make sure result contains stores
	//

	if (!isset($dominos_data->stores)){
		$dominos_data->stores = array();
	}

	// ---------------- cross-reference stores against DXP list
	// 

	foreach ($dominos_data->stores as $key => $store_obj) {
		$store_obj->hasDXP = !!array_search($store_obj->id, $dxp_store_list); //cast to boolean
	}

	$dominos_data->success = true;

	$sortByDXP = function ($a, $b){
		if ($a->hasDXP == TRUE && $b->hasDXP == FALSE) return -1;
		if ($a->hasDXP == FALSE && $b->hasDXP == TRUE) return 1;
		return 1;
	};
	if (sizeof($dominos_data->stores) > 0){
		usort($dominos_data->stores, $sortByDXP);
	}

	// ---------------- cache list
	$dominos_data->cached = date('Y-m-d H:i:s');
	writeAndCloseJSONFile($dominos_data_file, json_encode($dominos_data));

	// ---------------- return list
	$dominos_data->cached = false;
	return $dominos_data;
}

function dxpVote($store_id, $email, $opt_in){

	$ret = json_decode('{"success":true}');

	// Send vote ---------------------------------

	$data = array();
	$data["contact"] = array();
	$data["contact"]["Misc1"] = $store_id;
	$data["contact"]["EmailAddress"] = $email;
	$data["contact"]["AcceptedOfficialRules"] = true;
	
	$data["s"] = array();
	$data["s"]["z"] = ZING_KEY;
	$data_string = json_encode($data);

	$ch = curl_init( ZING_API_URL . "/submission" );
	
	// Configuring curl options
	$options = array(
		CURLOPT_RETURNTRANSFER => FALSE,
		CURLOPT_POST => TRUE,
		CURLOPT_POSTFIELDS => $data_string,
		CURLOPT_HTTPHEADER => array(                                                                          
			'Content-Type: application/json',                                                                                
			'Content-Length: ' . strlen($data_string)
		)
	);
	
	// Setting curl options
	curl_setopt_array( $ch, $options );
	
	// Send
	curl_exec($ch); 

	// Send opt-in ---------------------------------

	if (!$opt_in) {
		return $ret;
	}

	$data = array();
	$data["PromoOptIn"] = array();
	$data["PromoOptIn"]["EmailAddress"] = $email;
	$data["PromoOptIn"]["IsOptedIn"] = true;
	
	$data["s"] = array();
	$data["s"]["z"] = ZING_KEY;
	$data_string = json_encode($data);


	$ch = curl_init( ZING_API_URL . "/optin" );
	
	// Configuring curl options
	$options = array(
		CURLOPT_RETURNTRANSFER => FALSE,
		CURLOPT_POST => TRUE,
		CURLOPT_POSTFIELDS => $data_string,
		CURLOPT_HTTPHEADER => array(                                                                          
			'Content-Type: application/json',                                                                                
			'Content-Length: ' . strlen($data_string)
		)
	);
	
	// Setting curl options
	curl_setopt_array( $ch, $options );
	
	// Send
	curl_exec($ch);

	return $ret;
}


?>
