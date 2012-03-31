<?
$game_id =  htmlspecialchars($_GET["game_id"]);
$game_id = $game_id ? $game_id : 'tetris';
$game_name = htmlspecialchars($_GET["game_name"]);
$game_name = $game_name ? $game_name : ucwords($game_id);
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="author" content="Matthew Phillips">
	<title>Matthew Phillips - Games - <?=$game_name?></title>
	<link href="css/games.css" rel="stylesheet" type="text/css" media="all">
	<link href="css/<?=$game_id?>.css" rel="stylesheet" type="text/css" media="all">
	<script src="https://ajax.googleapis.com/ajax/libs/prototype/1.7/prototype.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/scriptaculous/1.9/scriptaculous.js"></script>
	<script src="js/games.js"></script>
	<script src="js/text_en.js"></script>
	<script src="js/<?=$game_id?>.js"></script>
</head>
<body>
	<div id="game_content"></div>
	<script>
		Sawkmonkey.Games.<?=ucwords($game_id)?>.init("game_content");
	</script>
</body>
</html>
