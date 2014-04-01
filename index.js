//2048-as-a-service
//Author: Sivamani Varun (varun@semantics3.com)
//Based on https://github.com/gabrielecirulli/2048

var restify = require('restify');
var util = require('util');
var uuid = require('node-uuid');
var crypto = require('crypto');
var Game = require('./lib/game_manager.js').GameManager;
var quotes = require('./lib/quotes.js');
var Table = require('cli-table');
var bunyan = require('bunyan');

var gameStates = {};
var MAX_GAMES = 50000; // 50K
var TIMEOUT = 300; // 5 minutes
var gameCount = 0;

var server = restify.createServer({
    name: '2048-as-a-service',
    version: '0.1.0'
});
server.use(
    restify.throttle({
        burst: 100,
        rate: 50,
        xff: true,
   })
);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.on('after', restify.auditLogger({
  log: bunyan.createLogger({
    name: 'audit',
    stream: process.stdout
  })
}));


//Obey ZEST principles
//All requests start with /hi
//Throw 800 if it didn't
server.pre(function(req, res, next) {
    if(!((req.url).match(/^\/hi\//))) {
        console.log(req.url);
        console.log("No hi...");
        res.send(800, new Error('Please say hi...'));
        return next();
    }
    return next();
});

function startGame(req, res, next) {
    if(gameCount > MAX_GAMES) {
        res.send(503, new Error('2048-as-a-service is running at max capacity. Sorry about that! Please try again in 5 minutes.'));
        return next();
    }
    var session_id = genSession();

    //Default game params
    var size = 4;
    var tiles = 2;
    var victory = 11;
    var rand = 2;

    //Custom game
    if((req.url).match(/\/size\//)) {
        size = parseInt(req.params.size);
        tiles = parseInt(req.params.tiles);
        victory = parseInt(req.params.victory);
        rand = parseInt(req.params.rand);

        if(size < 3 || size > 16) {
            res.send(503, new Error('Size can only be between 3 and 16.'));
            return next();
        }
        if(tiles < 1 || tiles > (size*size/2)) {
            res.send(503, new Error('Number of intial tiles can only be between 1 to size^2/2'));
            return next();
        }
        if(victory <= 10 || victory > 32) {
            res.send(503, new Error('Victory power cannot be smaller than or equal to rand or be greater than 32'));
            return next();
        }
        if(rand < 1 || rand >= victory) {
            res.send(503, new Error('Rand tiles has to be greater than 1 or less than victory'));
            return next();
        }
    }

    gameStates[session_id] = new Game(size,tiles,victory,rand);

    var json = '';
    if((req.url).match(/\/json/)) {
        json = '/json';
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Location', '/hi/state/' + session_id + json);
    res.send(302);
    return next();
}


function gameMove(req,res,next) {
    var session_id = req.params.session_id;

    //Check if session id exists
    if(!(session_id in gameStates)) {
        res.send(404, new Error('Invalid session id or session id has already expired.'));
        return next();
    }

    //Get game state from local cache
    var game = gameStates[session_id];

    //Check if move parameter was defined
    if(!(typeof req.params.move === "undefined")) {
        var move = parseInt(req.params.move);
        if(move < 0 || move > 3) {
            res.send(503, new Error('Invalid Move'));
            return next();
        }
        game.move(move);
        console.log("Move made for Session ID: " + session_id + " Move ID: " + move);
    }

    var gameState = game.getState();
    gameState['session_id'] = session_id;
    gameState['zen'] = quotes();

    var table = new Table({
chars: {
top: '-',
'top-mid':'+',
'top-left':'+',
'top-right':'+',
bottom: '-',
'bottom-mid':'+',
'bottom-left':'+',
'bottom-right':'+',
left: '|',
'left-mid': '|',
mid: '-',
'mid-mid': '+',
right: '|',
'right-mid': '+'
}}
);

    for(var i in gameState['grid']) {
        table.push(gameState['grid'][i]);
    }

    var tableData = table.toString();

    var str = 'Session ID: ' + session_id +  '\n';
    str += 'Overall Score: ' + gameState['score'] +  '\n\n';
    str += 'Grid:\n' + tableData + '\n\n';
    str += 'Zen:\n' + gameState['zen'] + '\n';
    if("message" in gameState) {
        str += '\nMessage: ' + gameState['message'] + '\n\n';
    }
    console.log(str);
    console.log(gameState);
    console.log(game);

    //JSON request, so send the gameState object
    if((req.url).match(/\/json/)) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(gameState);
        return next();
    }

    res.contentType = 'text';
    res.send(str);
    return next();
}

//Routes
server.get('/hi/start', startGame);
server.get('/hi/start/json', startGame);

server.get('/hi/start/size/:size/tiles/:tiles/victory/:victory/rand/:rand', startGame);
server.get('/hi/start/size/:size/tiles/:tiles/victory/:victory/rand/:rand/json', startGame);

server.get('/hi/state/:session_id',gameMove);
server.get('/hi/state/:session_id/json',gameMove);

server.get('/hi/state/:session_id/move/:move',gameMove);
server.get('/hi/state/:session_id/move/:move/json',gameMove);

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});

function genSession() {
    var session_id = crypto.createHash('sha1').update(uuid.v4()).digest('hex');
    gameCount++; // Increment game count
    console.log("New session requested. Game count: " + gameCount + " Session ID: " + session_id);
    return session_id;
}

//Delete all game sessions that were inactive for 5 minutes
function clearInactiveGames() {
    var curTime = Math.round(+new Date()/1000);
    console.log("Game state clean up kicking in. Timestamp: " + curTime + " Game count: " + gameCount);
    for(var game_session in gameStates){
        var game = gameStates[game_session];
        if(game.getLastActive() < (curTime - TIMEOUT)) {
            //Hackish way of keeping count
           gameCount--;
           console.log("Deleting session_id: " + game_session + " Timestamp: " + game.getLastActive());
           delete gameStates[game_session];
        }
    }
}

setInterval (clearInactiveGames, TIMEOUT*1000);

//Catch SIGTERM and SIGINT and uncaughtException for graceful shutdown
process.on( 'SIGTERM', function (err) {
    console.log('ERROR: Caught SIGTERM: ' + err);
    process.exit(1);
});

process.on( 'SIGINT', function (err) {
    console.log('ERROR: Caught SIGINT: ' + err);
    process.exit(1);
});

process.on('uncaughtException', function (err) {
    console.log('ERROR: Caught exception: ' + err);
    util.log(err.stack);
});
