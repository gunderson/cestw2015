<?
require_once("api_functions.php");
date_default_timezone_set("America/Los_Angeles");
define("DATA_CACHE_TTL", 0);// 24 hours from last post
define("GOOGLE_DOC_ID", "0AuINwfv5fymOdC12cG5BbElfUzJJNzU3VmZpVEpKWnc");// 24 hours from last post
define("VIDEO_SERVER", "..");

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
	case 'cycle_normals':
		echoFormattedAs(cycleNormals(), $format);
		break;
	case 'cycle_videos':
		echoFormattedAs(cycleVideos(), $format);
		break;
	case 'get_normals':
		echoFormattedAs(getNormals(), $format);
		break;
	case 'get_video_names':
		echoFormattedAs(getVideoNames(), $format);
		break;
	case 'validate_video_files':
		echoFormattedAs(validateVideoFiles(), $format);
		break;
	case 'update_logic':
		requireParam("data", $method);
		echoFormattedAs(updateLogic($_REQUEST["data"]), $format);
		break;
	case 'get_google_doc_address':
		echo "https://docs.google.com/a/b-reel.com/spreadsheet/ccc?key="+ GOOGLE_DOC_ID;
	default:
		echo "{\"success\":false,\"message\":\"method '$method' does not exist.\"}";
		break;
}

function updateLogic($json_data){
	try{
		$data = json_decode($json_data); // make sure the data is valid by parsing it
	} catch (Exception $error) {
		$results->success = false;
		return $results;
	}
	$file = openFile("data/logic.json");
	writeAndCloseJSONFile($file, json_encode($data));
	return $data;
}

function cycleNormals(){
	$document_id = GOOGLE_DOC_ID;
	$worksheet_ids = getWorksheetList($document_id);
	$worksheet = getWorksheet($document_id, $worksheet_ids[0]);
	$data = array();
	//create page node
	$page_name = $worksheet->feed->title->{'$t'};
	
	foreach ($worksheet->feed->entry as $field_index => $field_content) {
		//$field_content = $worksheet->feed->entry[0];
		$normal_name = $field_content->title->{'$t'};
		
		foreach($field_content as $normal_field => $normal_content){
			if(substr($normal_field,0,4) == "gsx$" && $normal_field != 'gsx$normal' && $normal_field != 'gsx$word'){
				if (!isset($data[$page_name])) {
					$data[$page_name] = array();
				}
				if ($normal_content->{'$t'} != ""){
					$data[$page_name][$normal_content->{'$t'}] = $normal_name;
				}
			}
		}			
	}
	
	$file = openFile("data/normals.json");
	writeAndCloseJSONFile($file, json_encode($data));
	return $data;

}

function getNormals(){
	$document_id = GOOGLE_DOC_ID;
	$worksheet_ids = getWorksheetList($document_id);
	$worksheet = getWorksheet($document_id, $worksheet_ids[0]);
	//create page node
	$page_name = $worksheet->feed->title->{'$t'};
	$dupeList = array();
	$data = array();
	foreach ($worksheet->feed->entry as $field_index => $field_content) {
		$normal_name = $field_content->title->{'$t'};
		if (!isset($data[$page_name])) {
			$data[$page_name] = array();
		}
		if (!isset($dupeList[$normal_name])) {
			$dupeList[$normal_name] = 1;
			$data[$page_name][] = $normal_name;
		}		
	}
	$file = openFile("data/normalNames.json");
	writeAndCloseJSONFile($file, json_encode($data));
	return $data;

}

function getVideos(){
	$document_id = GOOGLE_DOC_ID;
	$worksheet_ids = getWorksheetList($document_id);
	$worksheet = getWorksheet($document_id, $worksheet_ids[1]);
	$data = array();
	//create page node
	$page_name = $worksheet->feed->title->{'$t'};
	
	foreach ($worksheet->feed->entry as $field_index => $field_content) {
		//$field_content = $worksheet->feed->entry[0];
		$normal_name = $field_content->title->{'$t'};
		foreach($field_content as $normal_field => $normal_content){
			if(substr($normal_field,0,4) == "gsx$" 
				&& $normal_field != 'gsx$normal' 
				&& $normal_field != 'gsx$word' 
				&& $normal_field != 'gsx$bucket')
			{
				if (!isset($data[$page_name])) {
					$data[$page_name] = array();
				}

				$bucket = $field_content->{'gsx$bucket'}->{'$t'};
				if (!isset($data[$page_name][$bucket])) {
					$data[$page_name][$bucket] = array();
				}
				if (!isset($data[$page_name][$bucket][$normal_name])) {
					$data[$page_name][$bucket][$normal_name] = array();
				}
				if ($normal_content->{'$t'} != ""){
					$data[$page_name][$bucket][$normal_name][] = $normal_content->{'$t'};
				}
			}
		}			
	}
	return $data;
}

function cycleVideos(){
	$data = getVideos();
	$file = openFile("data/videos.json");
	writeAndCloseJSONFile($file, json_encode($data));
	return $data;
}

function getVideoNames(){
	$document_id = GOOGLE_DOC_ID;
	$worksheet_ids = getWorksheetList($document_id);
	$worksheet = getWorksheet($document_id, $worksheet_ids[1]);
	$data = array();
	$page_name = $worksheet->feed->title->{'$t'};
	$dupeList = array();
	foreach ($worksheet->feed->entry as $field_index => $field_content) {
		$normal_name = $field_content->title->{'$t'};
		if (!isset($data[$page_name])) {
			$data[$page_name] = array();
		}
		if (!isset($dupeList[$normal_name])) {
			$dupeList[$normal_name] = 1;
			$data[$page_name][] = $normal_name;
		}			
	}
	$file = openFile("data/videoNames.json");
	writeAndCloseJSONFile($file, json_encode($data));
	return $data;
}

function validateVideoFiles(){
	$data = getVideos();
	$fails->videos = array();
	foreach ($data["videos"] as $bucketId => $bucketArray) {
		foreach ($bucketArray as $videoName => $videoArray) {
			foreach ($videoArray as $key => $videoId) {
				if (!fileExists(VIDEO_SERVER . "/vid/$videoId.f4v")){
					$fails->videos[$videoName][] = $videoId;
				}
			}
		}
	}
	if (count($fails) > 0){
		$fails->success = false;
		return $fails;
	} else {
		$results->success = true;
		return $results;
	}
}

?>
