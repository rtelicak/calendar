<?php

	/* connect to the db */
	$link = mysql_connect('localhost','root','root') or die('Cannot connect to the DB');
	mysql_select_db('calendar',$link) or die('Cannot select the DB');

	/* grab the event from the db */
	$query = "SELECT * FROM events";
	$result = mysql_query($query,$link) or die('Errant query:  '.$query);

	/* create one master array of the records */
	$events = array();
	if(mysql_num_rows($result)) {
		while($event = mysql_fetch_assoc($result)) {
			$events[] = $event;
		}
	}

	mysql_close($link);

	header('Content-type: application/json');
	echo json_encode(array('events'=>$events));
?>