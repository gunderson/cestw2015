<?php

error_reporting(E_ALL);
ini_set('display_errors', 'On');

function fileExists($path){
    return (@fopen($path,"r")==true);
}

function requireParam($paramname, $callname){
	global $$paramname;
	if (!isset($_REQUEST[$paramname]) && !isset($$paramname)){
		echo "{\"success\":false,\"message\":\"parameter '$paramname' not set on $callname call\"}";
		die(1);
	}
	//convert request param to global param
	if (isset($_REQUEST[$paramname])){
		$$paramname = $_REQUEST[$paramname];
	}
}

function openJSONFile($fileName){
	$now = time();
	$file = new stdClass();
	//check local file
	$file->fileName = $fileName;
	$file->fh = fopen($fileName, 'a+');
	rewind($file->fh);
	if(filesize($fileName) > 0){
		//file has content
		$file->json_result = fread($file->fh, filesize($fileName));
		$file->result_obj = json_decode( $file->json_result);
	} else {
		//empty file, add default
		$file->json_result = '[]';
		$file->result_obj = json_decode( $file->json_result);
	}
	return $file;
}

function writeAndCloseJSONFile($file, $newContents){
	if (isset($file->fh)){
		ftruncate($file->fh, 0);
		rewind($file->fh);
		fwrite($file->fh, $newContents); 
		fclose($file->fh);
	};
}

function echoFormattedAs($obj, $format, $options = null){
	if (isset($options->outputFilename)){
		$outputFilename = $options->outputFilename;
	} else {
		$outputFilename = "api_output";
	}

	header('Access-Control-Allow-Origin: *');
	
	switch ($format){
		case "xml":
			header('Content-type: application/xml');
			echo $obj; // need to convert to XML
		break;
		case "csv":
			header('Content-type: text/csv');
			header("Content-disposition: attachment;filename=$outputFilename.csv");
			$output = '';
			foreach($obj->content[0] as $key => $value){
				$output .= '"' . $key . '",';
			}
			$output .= "\r\n";

			foreach($obj->content as $id => $content){
				foreach($content as $key => $value){
					$output .= '"' . $value . '",';
				}
				$output .= "\r\n";
			}
			echo $output;
		break;
		case "json":
		default:
			header('Content-type: application/json');
			echo json_encode($obj);
		break;
	}
}

function getWorksheetList($document_id){
	//get list of worksheets
	$worksheet_list_url = "https://spreadsheets.google.com/feeds/worksheets/$document_id/public/values?alt=json";
	// Initializing curl
	$ch = curl_init( $worksheet_list_url );
	
	// Configuring curl options
	$options = array(
	CURLOPT_RETURNTRANSFER => true
	);
	
	// Setting curl options
	curl_setopt_array( $ch, $options );
	
	// Getting results
	$json_result =  curl_exec($ch); // Getting jSON result string
	
	//serialize list
	$worksheet_json_list = json_decode($json_result);
	$num_worksheets = count($worksheet_json_list->feed->entry);
	
	//traverse list and make new page objects
	$worksheet_ids = array();
	foreach ($worksheet_json_list->feed->entry as $key => $value) {
		$worksheet_ids[] = substr($value->link[3]->href, -3);
	}
	return $worksheet_ids;
}

function getWorksheet($document_id, $worksheet_id){
	$worksheet_url = "https://spreadsheets.google.com/feeds/list/$document_id/$worksheet_id/public/values?alt=json";
	$ch = curl_init( $worksheet_url );
	$options = array(
		CURLOPT_RETURNTRANSFER => true
	);
	curl_setopt_array( $ch, $options );
	$json_result =  curl_exec($ch);
	return json_decode($json_result); 
}

?>