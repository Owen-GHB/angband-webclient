var playing = false;
var dimensions = {};

var safety = 2;            // for font size calculation
var font_sizes = [8,9,10,10.5,11,12,13,14,15,16,17,18,19,20,22,24,26,28,32,36,40];

function createTerminal(dimensions) {
	return new Terminal({
		termName: 'xterm-256color',
		colors: Terminal.xtermColors,
		cols: parseInt(dimensions.cols)+1,
		rows: parseInt(dimensions.rows)+1,
		cursorBlink: false,
		applicationCursor: true
	});
}

function applyTerminal(mode, qualifier, panels, walls, d) {
	//console.log(`applying terminal: mode=${mode}, qualifier=${qualifier}, panels=${panels}, walls=${walls}, dimensions=${d.rows}x${d.cols}`);
	$terminal = $("#terminal-container");
	dimensions = d;
	if(mode === "play") {
		if (!playing){
			playing = true;
			spyglass['default'] = createTerminal(d);
			$("#navigation ul").append(function() {
				return $('<li><a href="#"> - ' + qualifier + ' (your game)</a></li>').click(function() {
					applyTerminal("play", qualifier, panels, walls, d);
				});
			});
			socket.send(JSON.stringify({
				eventtype:'newgame',
				content: {
					game: qualifier,
					panels: panels,
					dimensions: d,
					walls: walls
				}
			}));
			spyglass['default'].on('data', function(data) {
				$("#keystrokeinput").html(JSON.stringify(data));
				socket.send(JSON.stringify({eventtype: 'gameinput', content: data}));
			});
		}
		$terminal.html("");
		spyglass['default'].open($terminal.get(0));
	}
	else if(mode === "spectate") {
		if (typeof(spyglass[qualifier]) == 'undefined') {
			$("#navigation ul").append(function() {
				return $('<li><a href="#"> - ' + qualifier + '</a></li>').click(function() {
					applyTerminal("spectate", qualifier, panels, walls, d);
				});
			});
			spyglass[qualifier] = createTerminal(d);
			socket.send(JSON.stringify({eventtype:'subscribe', content: {player: qualifier}}));
		}

		// alter font-size to fit player's row/cols to your screen
		adjustFontSizeForSpectation(d);
		

		$terminal.html("");
		spyglass[qualifier].open($terminal.get(0));
	}
	else if(mode === "update") {
		spyglass['default'] = createTerminal(d);
		socket.send(JSON.stringify({
			eventtype:'update',
			content: {
				game: qualifier,
				dimensions: d,
			}
		}));
		spyglass['default'].on('data', function(data) {
			$("#keystrokeinput").html(JSON.stringify(data));
			socket.send(JSON.stringify({eventtype: 'updateinput', content: data}));
		});

		$terminal.html("");
		spyglass['default'].open($terminal.get(0));
	}
	
	// hide lobby and unhide terminal with fade
	$("#games-lobby").addClass("hidden");
	$("#terminal-pane").removeClass("hidden");
}

function closeGame(){
	$("#navigation ul").html("");
	$("#navigation ul").append(function() {
		return $('<li><a id="navigation-home" href="#"> - home</a></li>').click(function() {
			$("#terminal-pane").addClass("hidden");
			$("#games-lobby").removeClass("hidden");
		});
	});
	if(Object.keys(spyglass).length > 0) {
		for(var i in spyglass) {
			if (i!='default') {
				$("#navigation ul").append(function(i) {
					return $('<li><a href="#"> - ' + i + '</a></li>').click(function() {
						applyTerminal("spectate", i, 1, false);
					});
				}(i));	
			} else {
				delete spyglass[i];
			}
		}
	}
	$("#terminal-pane").addClass("hidden");
	$("#games-lobby").removeClass("hidden");
	playing=false;
}

function adjustTerminalFontSize() {
	console.warn("adjustTerminalFontSize is deprecated!");
}

function adjustFontSizeForSpectation(remote_game_dimensions) {
	console.log("calculating adjusted font size to fit remote terminal with dimensions", remote_game_dimensions);
	var selected_font_family = $("#extra-fonts").val();
	
	var my_pane_height = $(".pane-main").height();
	var my_pane_width  = $(".pane-main").width();

	// find font size that will fit remote terminal to your game pane
	var found = false, checked_font_index = 0;
	$("#tester").css("font-family", selected_font_family);
	$("#tester").css("display", "initial");
	$("#tester").css("visibility", "hidden");
	for(var i = 0; i < font_sizes.length && !found; i++) {
		// set new font size to tester
		$("#tester").css("font-size", font_sizes[i]);

		// get tester new size
		var tester_width = $("#tester").width();
		var tester_height = $("#tester").height();

		// calculate my term size using current font size
		var resulting_rows = tester_height * remote_game_dimensions.rows;
		var resulting_cols = tester_width  * remote_game_dimensions.cols;

		// check how it fits, exit loop if it is bigger
		if(resulting_rows > my_pane_height || resulting_cols > my_pane_width)
			found = true;

		checked_font_index = i;
	}

	// apply selected font settings to terminal pane
	$("#terminal-container").css("font-size", font_sizes[checked_font_index - 1]);
	$("#terminal-container").css("font-family", selected_font_family);
	$("#terminal-container").css("line-height", "initial");
}

function calculateIdealTerminalDimensions() {
	var desired_font_size = $("#games-font-size").val();
	var desired_font_family = $("#extra-fonts").val();

	// apply desired font size to tester and get its new dimensions
	$("#tester").css("display", "initial");
	$("#tester").css("visibility", "hidden");
	$("#tester").css("font-size", desired_font_size);
	$("#tester").css("font-family", desired_font_family);
	
	var tester_width = $("#tester").width();
	var tester_height = $("#tester").height();
	
	var pane_height = $(".pane-main").height() - 2 * parseInt(desired_font_size, 10);
	var pane_width = $(".pane-main").width() - parseInt(desired_font_size, 10);

	// apply selected font settings to terminal pane
	$("#terminal-container").css("font-size", desired_font_size);
	$("#terminal-container").css("font-family", desired_font_family);
	$("#terminal-container").css("line-height", "initial");

	// calculate how many testers can we fit into pane-main
	var _width = (pane_width / tester_width).toFixed(0);
	var _height = (pane_height / tester_height).toFixed(0);

	//console.log(`${pane_width}x${pane_height} fit ${_width}x${_height} terminal (font size: ${desired_font_size}, tester: ${tester_width}x${tester_height})`);

	$("#tester").css("display", "none");


	return {
		rows: _height - 1, 
		cols: _width - 1
	};
}