var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', 'utf-8', function(error, content) {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
available_colors = ["green","blue","red","yellow","purple"];
taken_positions = {};

io.sockets.on('connection', function (socket) {

	function playerDead(killed,killer){
		socket.emit("gameover",killer);
		socket.broadcast.emit('otherdead', killed);
		taken_positions[killed]=[];
	}
	var color = available_colors[0];
	socket.emit('init',{"color":color,"other":taken_positions});
	available_colors.shift();

	socket.on('disconnect', function () {
		available_colors.push(color);
		playerDead(color,color);
	});

	socket.on('snake', function (snake) {
		snakeOne = snake;
		var new_block = snake.position[snake.position.length-1];
		var is_dead = false;

		switch(snake.direction){
			case "ArrowRight":
				new_block.x = (new_block.x + 1) % 100;
				break;
			case "ArrowLeft":
				new_block.x = new_block.x - 1
				if(new_block.x===-1){new_block.x=99;}
				break;
			case "ArrowUp":
				new_block.y = (new_block.y - 1);
				if(new_block.y===-1){new_block.y=99;}
				break;
			case "ArrowDown":
				new_block.y = (new_block.y + 1) % 100;
				break;
		}


		for(player in taken_positions){
			for(var i =0;i<taken_positions[player].length;i++){
				if(taken_positions[player][i].x === new_block.x && taken_positions[player][i].y === new_block.y){
					playerDead(color);
					is_dead =true;
					break;
				}
			}		
		}
		
		if(!is_dead){
			if(taken_positions[snake.color]){
				taken_positions[snake.color].push(new_block);
			}else{
				taken_positions[snake.color] = [new_block];
			}
			if(snake.direction != "static"){
				setTimeout(function(){
					socket.emit("myNewBlock",new_block);
				},process.env.TIMES||50);
				socket.broadcast.emit('othersnake', {"position":new_block,"color":snake.color});
			}
		}
		
	
	});	

});

server.listen(process.env.PORT || 5000);