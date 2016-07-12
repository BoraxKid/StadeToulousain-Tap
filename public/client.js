var socket = io();

var team = 0;
var taps_red = 0;
var taps_black = 0;
var party_time = 0;
var elapsed_time = 0;
var wait_time = 5;
var wait = false;
var winning_team = 0;
var percentage = 50;

function send_taps_red() {
    if (taps_red > 0) {
	socket.emit('poke_red', taps_red);
	taps_red = 0;
    }
}

function send_taps_black() {
    if (taps_black > 0) {
	socket.emit('poke_black', taps_black);
	taps_black = 0;
    }
}

function decrease_timer() {
    ++elapsed_time;
    display();
}

function next_game(seconds) {
    return (("Prochaine partie dans " + seconds + " seconde" + ((seconds > 1) ? "s" : "")));
}

function display() {
    var seconds = (wait_time - elapsed_time);
    if (wait && team == 0) {
	if (seconds <= 0) {
	    $('#timer').text("GO !");
	} else {
	    if (winning_team == 3) {
		$('#timer').text("Égalité! " + next_game(seconds));
	    } else if (winning_team == 1) {
		$('#timer').text("L'équipe rouge l'emporte! " + next_game(seconds));
	    } else if (winning_team == 2) {
		$('#timer').text("L'équipe noire l'emporte! " + next_game(seconds));
	    } else {
		$('#timer').text(next_game(seconds));
	    }
	}
    } else if (wait && (team == 1 || team == 2)) {
	if (seconds <= 0) {
	    $('.button').text("GO !");
	} else {
	    if (winning_team == 3) {
		$('.button').text("Égalité! " + next_game(seconds));
	    } else if ((winning_team == 1 && team == 1) || (winning_team == 2 && team == 2)) {
		$('.button').text("Gagné! " + next_game(seconds));
	    } else if ((winning_team == 1 && team == 2) || (winning_team == 2 && team == 1)) {
		$('.button').text("Perdu! " + next_game(seconds));
	    } else {
		$('.button').text(next_game(seconds));
	    }
	}
    } else {
	$('.button').html("Tap!<br />Temps restant: " + parseInt(party_time - elapsed_time));
	$('#timer').text("Temps restant: " + parseInt(party_time - elapsed_time));
    }
}

setInterval(send_taps_red, 1000);
setInterval(send_taps_black, 1000);
setInterval(decrease_timer, 1000);

$('#red').submit(function() {
    if (team == 1)
	++taps_red;
    return (false);
});

$('#black').submit(function() {
    if (team == 2)
	++taps_black;
    return (false);
});

socket.on('stop', function(msg) {
    winning_team = parseInt(msg);
    wait = true;
    elapsed_time = 0;
    display();
});

socket.on('go', function(msg) {
    party_time = parseInt(msg);
    elapsed_time = 0;
    wait = false;
    display();
});

socket.on('percentage', function(msg) {
    percentage = parseInt(msg);
    $('.radial-progress').attr('data-progress', percentage);
    $('.percentage#left').text(percentage);
    $('.percentage#right').text(100 - percentage);
    resizeMeter(false);
});

socket.on('display', function(msg) {
    team = 0;
    resizeMeter();
    $('.radial-progress').css('display', "block");
    $('.percentage#left').css('display', "block");
    $('.percentage#right').css('display', "block");
});

socket.on('team_red', function(msg) {
    team = 1;
    $('#red').css('display', "block");
});

socket.on('team_black', function(msg) {
    team = 2;
    $('#black').css('display', "block");
});

function resizeMeter(force = true) {
    var size = parseInt(($('.progress-container').width() + $('.progress-container').height()) / 2);
    var size7 = parseInt(size * 0.7);
    var size_timer = parseInt(size * 1.3);
    var diff1 = 0;
    var diff2 = 0;

    if (percentage == 100)
	diff1 = 1;
    else if (percentage == 0)
	diff2 = 1;

    if (force) {
	$('.radial-progress')
	    .css('width', size)
	    .css('height', size);
	
	$('.radial-progress .inset')
	    .css('width', size7)
	    .css('height', size7)
	    .css('margin-left', parseInt((size - size7) / 2))
	    .css('margin-top', parseInt((size - size7) / 2));
	
	$('.radial-progress .inset #timer')
	    .css('top', parseInt((size_timer - 22) / 2))
	
	$('.radial-progress .circle .mask')
	    .css('width', size)
	    .css('height', size);
	
	$('.radial-progress .circle .fill')
	    .css('width', size)
	    .css('height', size);
	
	$('.radial-progress .circle .shadow')
	    .css('width', size)
	    .css('height', size);
    }
    $('.radial-progress .circle .mask')
	.css('clip', 'rect(0px, ' + size + 'px, ' + size + 'px, ' + size / 2 + 'px)');
    $('.radial-progress .circle .mask.half')
	.css('clip', 'rect(0px, ' + size + 'px, ' + size + 'px, ' + ((size / 2) - diff1) + 'px)');
    $('.radial-progress .circle .mask .fill')
	.css('clip', 'rect(0px, ' + ((size / 2) - diff2) + 'px, ' + size + 'px, 0px)');
}

$(window).resize(function () {
    resizeMeter();
});
