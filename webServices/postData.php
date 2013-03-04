<?php

	/* connect to the db */
	$link = mysql_connect('localhost','root','root') or die('Cannot connect to the DB');
	mysql_select_db('calendar',$link) or die('Cannot select the DB');

	// parse dates to be inserted to db
	$summary = $_POST['summary'];
	$startTime = date("Y-m-d G:i:s", $_POST['startTime'] / 1000);
	$endTime = date("Y-m-d G:i:s", $_POST['endTime'] / 1000);

	/* grab the event from the db */
	$query = "INSERT INTO events (summary, startTime, endTime) VALUES ('$summary', '$startTime', '$endTime')";
	$result = mysql_query($query,$link) or die('Errant query:  '.$query);
	$id = mysql_insert_id($link);

	header('Content-type: application/json', true, 200);
	// send an id of created event to client
	echo json_encode($id);

	mysql_close($link);
?>