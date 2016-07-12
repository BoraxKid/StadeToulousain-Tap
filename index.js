var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');
var os = require('os');

var taps_red = 0;
var taps_black = 0;
var old_taps_red = 0;
var old_taps_black = 0;
var changed = false;
var co = 0;
var displays = [];
var party_time = 20;
var wait_time = 5;
var elapsed_time = 0;
var waiting = false;
var winning_team = 0;

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

setInterval(send_progression, 100);
setInterval(increase_timer, 1000);

function stop() {
    if (taps_red > taps_black) {
	winning_team = 1;
    } else if (taps_red < taps_black) {
	winning_team = 2;
    } else {
	winning_team = 3;
    }
    taps_red = 0;
    taps_black = 0;
    old_taps_red = 0;
    old_taps_black = 0;
    elapsed_time = 0;
    waiting = true;
    io.emit('stop', winning_team);
    send_progression(true);
}

function increase_timer() {
    ++elapsed_time;
    if (waiting == false && elapsed_time >= party_time)
	stop();
    if (waiting == true && elapsed_time >= wait_time) {
	waiting = false;
	elapsed_time = 0;
	io.emit('go', party_time);
    }
}

function send_progression(force = false) {
    var length = displays.length;
    if (old_taps_red != taps_red || old_taps_black != taps_black)
	changed = true;
    else
	changed = false;
    if ((changed == true || force == true) && length > 0) {
	for (var i = 0; i < length; i++) {
	    if ((taps_red + taps_black) == 0)
		displays[i].emit('percentage', 50);
	    else
		displays[i].emit('percentage', ((taps_red / (taps_red + taps_black)) * 100));
	}
	console.log("progression sent to displays, total taps: " + (taps_red + taps_black) + " with " + taps_red + " red and " + taps_black + " black");
	old_taps_red = taps_red;
	old_taps_black = taps_black;
    }
}

io.on('connection', function(socket) {
    var params;
    var team = 0;
    var start_time = new Date();
    var end_time;
    var elapsed_time_user;

    ++co;
    if (socket.handshake.headers.referer) {
	params = url.parse(socket.handshake.headers.referer, true).query || {};
	if (params["display"] !== undefined) {
	    socket.emit('display', true);
	    displays.push(socket);
	    console.log("added new display");
	    send_progression(true);
	} else if (params["red"] !== undefined) {
	    socket.emit('team_red', true);
	    console.log("added new player on team RED");
	    team = 1;
	} else if (params["black"] !== undefined) {
	    socket.emit('team_black', true);
	    console.log("added new player on team BLACK");
	    team = 2;
	}
    }
    socket.emit('go', party_time - elapsed_time);
    console.log("new user count: " + co);
    socket.on('disconnect', function() {
	--co;
	console.log("user disconnected, total users still connected: " + co);
	var index = displays.indexOf(socket);
        if (index != -1) {
            displays.splice(index, 1);
	    console.log("removed a display, " + displays.length + " remaining");
        }
    });
    socket.on('poke_red', function(taps) {
	end_time = new Date();

	elapsed_time_user = Math.round(((end_time - start_time) / 1000) % 60);
	if (team == 1 && waiting == false && taps > 0 && taps < 50 && elapsed_time_user >= 0.8) {
	    taps_red += taps;
	    start_time = end_time;
	}
    });
    socket.on('poke_black', function(taps) {
	end_time = new Date();

	elapsed_time_user = Math.round(((end_time - start_time) / 1000) % 60);
	if (team == 2 && waiting == false && taps > 0 && taps < 50 && elapsed_time_user >= 0.8) {
	    taps_black += taps;
	    start_time = end_time;
	}
    });
});

http.listen(3000, function() {
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
	var alias = 0;

	ifaces[ifname].forEach(function (iface) {
	    if ('IPv4' !== iface.family || iface.internal !== false) {
		return;
	    }
	    if (alias >= 1) {
		console.log(ifname + ':' + alias, iface.address);
	    } else {
		console.log(ifname, iface.address);
	    }
	    ++alias;
	});
    });
    console.log('port: 3000');
});
