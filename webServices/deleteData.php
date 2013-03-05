<?php

	/* connect to the db */
	$link = mysql_connect('localhost','root','root') or die('Cannot connect to the DB');
	mysql_select_db('calendar',$link) or die('Cannot select the DB');

	$id = $_POST['id'];

	/* grab the event from the db */
	$query = "DELETE FROM events WHERE id = ".$id."";
	$result = mysql_query($query,$link) or die('Errant query:  '.$query);

	header('Content-type: application/json', true, 200);
	// send an event to client to be deleted from store as well
	echo json_encode($id);
	mysql_close($link);
?>