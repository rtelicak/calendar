<?php

	/* connect to the db */
	$link = mysql_connect('localhost','root','root') or die('Cannot connect to the DB');
	mysql_select_db('calendar',$link) or die('Cannot select the DB');

	// parse dates to be inserted to db
	$id = $_POST['id'];
	$summary = $_POST['summary'];
	$startTime = date("Y-m-d G:i:s", $_POST['startTime'] / 1000);
	$endTime = date("Y-m-d G:i:s", $_POST['endTime'] / 1000);

	// create query and execute it
	$query = "UPDATE events SET summary='$summary', startTime='$startTime', endTime='$endTime' WHERE id=".$id."";
	$result = mysql_query($query,$link) or die('Errant query:  '.$query);

	header('Content-type: application/json', true, 200);
	// send an whole item to client
	echo json_encode($id);

	mysql_close($link);
?>