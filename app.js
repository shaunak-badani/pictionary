/* 
	- No win check unless game started

-*/

var express = require('express');

var app = express();
var http = require('http');
var server = http.createServer(app)
var io = require('socket.io').listen(server);
var game = require('./agxgame.js');
var fs = require('fs');
var wordList;

//temporary word list, mongodb integration in progress

fs.readFile('words.json', 'utf8', function (err, data) {
  if (err) throw err;
  wordList = JSON.parse(data);
});

// var static = require('node-static');
// var fileServer = new static.Server
server.listen(process.env.PORT || 5000);
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res) {
  res.sendfile('index.html');
});
// app.get('/words', function(req, res) {
//   res.sendfile('assets/img/words.txt');
// });
app.get('/g/:id', function(req,res) {
  res.send("<p>Feature currently in development");
});
io.on('connection', function(socket){
	game.initGame(io,socket,wordList);
});



