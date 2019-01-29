// TODO: Create new field to store whether someone has guessed the correct word, cannot use hasAlreadyWon
// TODO: Change the Timers to deploy 
// TODO: Change to a new Server
// TODO: Allow server to handle the random number generator so the revealed letters are equal among all devices
    var IO = {
        init : function(){
            var url = "http://localhost:5000";
            //var url = 'https://draw-prototype.herokuapp.com/';
            //var url = 'https://ancient-fjord-8441.herokuapp.com';
            //var url = 'https://129.97.134.17:5000;'
            IO.socket = io.connect(url);
            IO.bindEvents();

        },
        bindEvents: function(){
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated',IO.onNewGameCreated);
            IO.socket.on('playerJoinedRoom',IO.onplayerJoinedRoom);
            IO.socket.on('updatePlayerPlayers',IO.updatePlayerPlayers);
            IO.socket.on('newChatMessage',IO.newChatMessage);
            IO.socket.on('prepareStartGame',IO.prepareStartGame);
            IO.socket.on('isMoving',IO.isMoving);
            IO.socket.on('gameEnded',IO.gameEnded);
            IO.socket.on('saveChatHistory', IO.saveChatHistory);
            IO.socket.on('startTimer', IO.startTimer);
            IO.socket.on('updateTimer', IO.updateTimer);
            IO.socket.on('updateUserPoints', IO.updateUserPoints);
            IO.socket.on('receiveNewColor', IO.receiveNewColor);
            IO.socket.on('receiveNewDrawThickness', IO.receiveNewDrawThickness);
            IO.socket.on('restartPath', IO.restartPath);
            IO.socket.on('displayNewGameScreen', IO.onDisplayNewGameScreen);
            IO.socket.on('updatePlayerTurn',IO.updatePlayerTurn);
            IO.socket.on('ignoreNewPlayer',IO.ignoreNewPlayer);
            IO.socket.on('clearDrawingCanvas',IO.clearDrawingCanvas);
            IO.socket.on('userHasLeft', IO.userHasLeft);
            IO.socket.on('gameEndedLobby',IO.gameEndedLobby);
        },
        onConnected: function(){
            App.mySocketID = IO.socket.id;

        },
        onNewGameCreated: function(data){
            App.gameInit(data);
        },
        onplayerJoinedRoom: function(data){
            App.updatePlayers(data);
        },
        updatePlayerPlayers: function(data){
            App.updatePlayerScreen(data);
        },
        newChatMessage: function(data){
            App.updateChat(data);
        },
        prepareStartGame: function(data){
            App.prepareStartGame(data);
        },
        isMoving: function(data, drawer_window_size){
            App.moving(data, drawer_window_size);
        },
        gameEnded: function(data){
            App.gameEnded(data);
        },
        saveChatHistory: function(data){
            chatHistory = data;
            //console.log(chatHistory);
        },
        startTimer: function(turnLength, start){
            App.startTimer(turnLength, start);
        },
        updateTimer: function(secs){
            App.updateTimer(secs);
        },
        updateUserPoints: function(data){
            App.updateUserPoints(data);
        },
        receiveNewColor: function(data){
            App.ctx.beginPath();
            color = data;
        },
        receiveNewDrawThickness: function(data){        
            App.ctx.beginPath();
            drawThickness = data;
        },
        restartPath: function(){
            App.ctx.beginPath();
        },
        onDisplayNewGameScreen: function(data){
            App.displayNewGameScreen(data);
        },
        updatePlayerTurn: function(data){
            turn=data.turn;
        },
        ignoreNewPlayer: function(data){
            if(App.players.length>0)
                App.players[App.players.length-1].hasAlreadyWon=true;
        },
        clearDrawingCanvas: function(){
            App.ctx.clearRect( 0 , 0 , App.canvas[0].width, App.canvas[0].height );
        },
        userHasLeft: function(data){
            App.userHasLeft(data);
        },
        gameEndedLobby: function(){
            App.gameEndedLobby();
        }
    }
    var windowSize = {
        viewPortWidth: jQuery(window).width(),
        viewPortHeight: jQuery(window).height(),
        chatBoxWidth: 0
    };
    var hint = "";
    var letters_to_reveal = new Array();
    var total_reveal_count = 0;
    var reveal_interval = 0;
    var preventCursorRace = false; //stops a residual cursor after a new game starts
    var displayHelp ={ lobby:false, drawer:false, guesser:false};
    var drawThickness = 10;
    var color = '#000';
    var ticker;
    var turnLength_global = 10; //!!!Change
    var end_round_wait_time = 10; //!!!Change
    var currentTimer = 0;
    var firstCorrectAnswer = true;
    var turn = 0;
    var usersHistory = '';
    var pointsHistory = '';
    var chatHistory = '';
    var PointAllocation = {
        FirstAnswer: 5,
        SubsequentAnswer: 2,
        DrawerPoints: 2,
        FailDrawDeduction: 5
    };
    var App = {
        gameID:0,
        myRole: '',
        myName: '',
        mySocketID:'',
        players : [],
        clients:{},
        word:"",
        gameRole: 'guess',
        gameState: 'home',
        init: function(){
            App.cacheElements();
            App.bindEvents();
        },
        cacheElements: function(){
            App.$doc = $(document);
            App.$chat_template = $('#chat_template').html();
            App.$game_area  = $('#game_area').html();
            App.$lobby = $('#lobby').html();
            App.$palette = $('#palette_template').html();
            App.$in_progress_lobby = $('#in_progress_lobby').html();
            App.$end_round_lobby = $('#end_round_lobby').html();
        },
        bindEvents: function(){
            App.$doc.on('click','#create_room',App.onCreateClick);
            App.$doc.on('click','#join_room',App.onJoinRoom);
            App.$doc.on('click','#send_message',App.sendMessage);
            App.$doc.on('click','#start_game',App.startGame);
            App.$doc.on('click','.palette-color',App.updateDrawColor);
            App.$doc.on('click','.palette-thickness',App.updateDrawThickness);
            App.$doc.on('click','#game_tutorial',App.prepareGameTutorial);
            App.$doc.on('click','#clear-canvas',App.clearCanvas);
            $(window).resize(App.recalculateDimensions);
            window.onbeforeunload = function(){
                if(App.gameState == 'playing')
                    return 'You are Currently in a game. Are you sure you want to leave?'
            };
            window.onunload = App.onUserLeave;
        },
        onCreateClick: function(){
            data={playerName:$('#player_name').val() || 'anon',
                  myPoints: 0,
                  hasAlreadyWon: false,
                  guessedCorrectly: false
                  };
            IO.socket.emit('hostCreateNewGame',data);
        },
        gameInit: function(data){
            App.gameID=data.gameID;
            App.mySocketID=data.mySocketID;
            App.myRole='Host';
            App.myName=data.playerName;
            App.displayNewGameScreen(data);
        },
        displayNewGameScreen : function(data){
            App.gameState = 'lobby';
            $('#main_area').html((data.playing)?App.$in_progress_lobby:App.$lobby);
            $('#instructions').html("<h1>Game ID: "+App.gameID+"</h1><p>Give your friends this ID to join or this <a href='http://draw-prototype.herokuapp.com/g/"+App.gameID+"'>link</a></p><h1>Users</h1>");
            $('#room_number_header').html('Game ID: '+ App.gameID);
            $("#chat_area").html(App.$chat_template);
            $('#messages').append(chatHistory);
            App.$cont = $('#chat');
            $("#m").keyup(function(event){
                if(event.keyCode == 13){
                    $("#send_message").click();
                    
                }
            });
            if(displayHelp.lobby == true){
                startLobbyIntro();
                displayHelp.lobby = false;
            }
        },
        onJoinRoom: function(){
            //console.log('onjoinroom');
            var data = {gameID: $('#room_id').val(), 
                        playerName:$('#player_name').val() || 'anon',
                        myPoints: 0,
                        hasAlreadyWon: false,
                        guessedCorrectly: false
                        };
            IO.socket.emit('playerJoinGame',data);
            App.myRole = 'Player';
            App.myName=data.playerName;
            App.gameID=data.gameID;
            App.myPoints=0;
            //console.log(data);
            
        },
        updatePlayers: function(data){
            if (App.myRole == 'Host'){
                $('#players_waiting').append('<p>'+data.playerName+'</p>');
                App.players.push(data);
                IO.socket.emit('updatePlayerPlayersServer',App.players);
                if (data.playing)
                    App.players[App.players.length-1].hasAlreadyWon=true;
            }
        },
        updatePlayerScreen: function(data){
            if (App.myRole == 'Player'){
                $("#chat_area").html(App.$chat_template);
                $('#messages').append(chatHistory);
                $('#players_waiting').html("");
                App.players = data;
                for (var i = 0 ; i < data.length; i++){
                    $('#players_waiting').append('<p>'+data[i].playerName+'</p>');
                }
                if (data.playing)
                    App.players[App.players.length].hasAlreadyWon=true;
                if(displayHelp.lobby == true){
                startLobbyIntro();
                displayHelp.lobby = false;
                }
            }
            var userList = "<li class='pure-menu-item'>Users</li>";
            var pointsList = "<li class='pure-menu-item'>Score</li>";
            for(var i = 0; i < data.length; i++){
                userList = userList + "<li id='user"+data[i].mySocketID+"' class='pure-menu-item'>"+data[i].playerName+"</li>";
                pointsList = pointsList + "<li id='"+data[i].mySocketID+"score' class='pure-menu-item'>"+data[i].myPoints+"</li>";
            }
            //console.log(data);
            //console.log(userList);
            //console.log(pointsList);
            $("#userlist").html(userList);
            $("#score").html(pointsList);
            usersHistory = userList;
            pointsHistory = pointsList;
            IO.socket.emit('updateUserList', data);
        },
        sendMessage: function(){
            var chat_message=$('#m').val();
            //console.log(chat_message);
            //console.log(App.word);
            //console.log('App.hasAlreadyWon = '+App.hasAlreadyWon);
            if (App.gameState == "playing" && chat_message.toUpperCase().indexOf(App.word) != -1 && App.gameRole != 'drawer' && !App.hasAlreadyWon){
                $("#drawer_word").html("You Guessed the Right Word: "+App.word);
                App.hasAlreadyWon = true;
                data= {name:App.myName, gameID:App.gameID, socketID:App.mySocketID};
                IO.socket.emit('givePoints',data);
                return;
            }
            if (App.gameState == "playing" && chat_message.toUpperCase().indexOf(App.word) != -1){
                return;
            }
            var data = { playerName:App.myName,message:chat_message,gameID:App.gameID};
            IO.socket.emit('chatMessage',data);
            $('#m').val('');
        },
        updateChat: function(data){
            $('#messages').append($('<li class="pure-menu-item">').text(data.playerName+": "+data.message));
            App.$cont[0].scrollTop = App.$cont[0].scrollHeight;
            App.$cont[0].scrollTop = App.$cont[0].scrollHeight;
            //console.log('chat data data');
            //console.log(data);
            IO.socket.emit('updateServerChatHistory', data, $('#messages').html());
        },
        startGame: function(){
            //console.log(App.gameID);
            IO.socket.emit('startDrawingTimer', App.gameID, turnLength_global, true);
            IO.socket.emit('startGame',App.gameID);
        },
        prepareStartGame: function(data){
            $("#paper").css("cursor", "default");
            //console.log(App.players);
            //console.log(turn);
            App.hasAlreadyWon = false;
            firstCorrectAnswer = true;
            windowSize.chatBoxWidth = $("#chat_area").width(); //grabs the width of the chatbox for scaling
            for(var i = 0; i < App.players.length; i++){
                App.players[i].hasAlreadyWon = false;
                App.players[i].guessedCorrectly = false;
            }
            $("#palette_area").html('');
            $("#main_area").html(App.$game_area);
            $("#chat_area").html(App.$chat_template);
            $('#messages').append(chatHistory);
            $("#userlist").html(usersHistory);
            $("#score").html(pointsHistory);
            App.$cont = $('#chat');
            $("#m").keyup(function(event){
                if(event.keyCode == 13){
                    $("#send_message").click();
                    
                }
            });
            App.gameState = "playing";
            App.drawing = false;
            App.canvas = $('#paper');
            App.canvas[0].width=window.innerWidth;
            App.canvas[0].height=window.innerHeight;
            App.ctx = App.canvas[0].getContext('2d');
            App.clients = {};
            App.cursors = {};
            App.prev = {};
            App.lastEmit = $.now();
            App.hasAlreadyWon = false;
            App.gameRole = (App.mySocketID==App.players[turn].mySocketID?"drawer":"guesser");
            App.word=data.word;
            $("#current-word").html((App.gameRole=="drawer")?"Word: "+App.word:"");
            App.canvas.on('mousedown',function(e){
                App.ctx.beginPath();
                if(App.gameRole == "drawer"){
                    e.preventDefault();
                    App.drawing = true;
                    App.prev.x = e.pageX;
                    App.prev.y = e.pageY;
                }
            });
            App.$doc.bind('mouseup mouseleave',function(){
                if(App.gameRole == 'drawer'){
                    IO.socket.emit('restartDrawPath', App.gameID);
                }
                App.drawing = false;
            });
            //todo send window dimensions
            App.$doc.on('mousemove',function(e){
                if($.now() - App.lastEmit > 10 && App.gameRole == 'drawer' && currentTimer > 1 && preventCursorRace == false){ //todo prevent race
                    var moveData = {
                        'gameID': App.gameID,
                        'x': e.pageX,
                        'y': e.pageY,
                        'drawing': App.drawing,
                        'id': App.mySocketID
                    };

                    IO.socket.emit('mousemove',moveData, windowSize);
                    App.lastEmit = $.now();
                }
                if(App.drawing){

                    App.drawLine(App.prev.x, App.prev.y, e.pageX, e.pageY);

                    App.prev.x = e.pageX;
                    App.prev.y = e.pageY;
                }
            });
            if(App.gameRole == "drawer"){
                //console.log("i am the drawer");
                //console.log(App.word);
                $("#paper").css("cursor","url('http://draw-prototype.herokuapp.com/assets/img/pencil.png') 0 100, pointer");
                $("#palette_area").html(App.$palette);
                $("#your_role").html("You are the Drawer");
                $("#drawer_word").html("The Word is: "+App.word);
                if(displayHelp.drawer == true){
                    startDrawerIntro();
                    displayHelp.drawer = false;
                }


            }
            if(App.gameRole == "guesser"){
                hint = '';
                for( var i = 0; i < App.word.length; i++){
                    //console.log(App.word[i]);
                        if(App.word[i]==' '){
                            //console.log(true);
                           hint = hint + '&nbsp;&nbsp;&nbsp;';
                        }
                        else
                           hint = hint+'_ ';
                }
                $("#your_role").html("You are a Guesser");
                $("#drawer_word").html("Hint&nbsp;&nbsp&nbsp;"+hint);
                if(displayHelp.guesser == true){
                    startGuesserIntro();
                    displayHelp.guesser = false;
                }
                //console.log("i am the guesser");
                //console.log("i dont know the word is"+ App.word);
            }
            $("#user"+App.players[turn].mySocketID).html(App.players[turn].playerName+' (drawer)');
            
            //console.log(App.word + "length = " + App.word.length);
            letters_to_reveal = [];
            for(var i = 0; i < App.word.length; i++){
                if(App.word[i] != " ")
                    letters_to_reveal.push(i);
            }
            //console.log("letters to reveal length " + letters_to_reveal.length);
            if(letters_to_reveal.length > 2){
                total_reveal_count = Math.floor(letters_to_reveal.length / 2);
                reveal_interval = Math.ceil(turnLength_global / (total_reveal_count + 1));
            }
            else{
                total_reveal_count = 0;
                reveal_interval = 'none';
            }
            preventCursorRace = false; //tells everyone to start receiving cursor signals again
        },

        moving: function (data, drawer_window_size) {
            if(preventCursorRace){
                return;
            }
            var drawer_canvas_size_x = drawer_window_size.viewPortWidth - drawer_window_size.chatBoxWidth;
            var x_ratio = data.x / drawer_canvas_size_x;
            var y_ratio = data.y / drawer_window_size.viewPortHeight;
            data.x = x_ratio * (windowSize.viewPortWidth - windowSize.chatBoxWidth);
            data.y = y_ratio * windowSize.viewPortHeight;
            //resizing appropriate ratios for different monitor resolutions
            if(! (data.id in App.clients)){
                //$('#cursors').empty();
                App.cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
            }
            App.cursors[data.id].css({
                'left' : data.x,
                'top' : data.y
            });
            //todo update with the correct dimensions
            if(data.drawing && App.clients[data.id]){

                App.drawLine(App.clients[data.id].x, App.clients[data.id].y, data.x, data.y);
            }
            App.clients[data.id] = data;
            App.clients[data.id].updated = $.now();
        },
        drawLine: function(fromx, fromy, tox, toy){
            //App.ctx.moveTo(fromx, fromy);
            App.ctx.lineWidth = drawThickness;
            App.ctx.strokeStyle = color;
            App.ctx.lineTo(tox, toy);
            App.ctx.stroke();
        },
        gameEnded: function(data){
            //update points
            preventCursorRace = true;   //tells everyone to stop receiving cursor mousemove signals
            var userList = "<li class='pure-menu-item'>Users</li>";
            var pointsList = "<li class='pure-menu-item'>Score</li>";
            for(var i = 0; i < App.players.length; i++){
                userList = userList + "<li id='user"+App.players[i].mySocketID+"' class='pure-menu-item'>"+App.players[i].playerName+"</li>";
                pointsList = pointsList + "<li id='"+App.players[i].mySocketID+"score' class='pure-menu-item'>"+App.players[i].myPoints+"</li>";
            }
            usersHistory = userList;
            pointsHistory = pointsList;
            //console.log('all players list');
            //console.log(App.players);
            if (App.myRole=="Host"){
                if(turn < App.players.length -1)
                    turn++;
                else
                    turn = 0;
                var data = {gameID:App.gameID,turn:turn}
                IO.socket.emit('updateTurn',data);
            }


            //console.log(chatHistory);
            App.gameState = "lobby";
            //console.log("i know who won");
            if(App.myRole == 'Host')//!!!Change
                IO.socket.emit('endGameLobby', App.gameID);
                //IO.socket.emit('startGame',App.gameID);
            //console.log(chatHistory);
            // $("#main_area").html(App.$lobby);
            // $('#instructions').html("<h1>"+App.gameID+"</h1><h2>Winner: "+data+"</h2");
            for (var i  = 0 ; i < App.players.length ; i ++ ){
                //console.log(App.players);
                $('#players_waiting').append('<p>'+App.players[i].playerName+'</p>');
            }
        },
        gameEndedLobby: function(){ //!!!Change
            $('#main_area').html(App.$end_round_lobby);

            if(App.players[turn].playerName == App.myName){
                $('#next_drawer').html("You Are ");
            }
            else{
                $('#next_drawer').html(App.players[turn].playerName + " is ");
            }

            App.startTimer(end_round_wait_time, false);
            App.gameState = "endLobby";
            var correct_count = 0;
            for(var i = 0; i < App.players.length; i++){
                if(App.players[i].guessedCorrectly == true){
                    correct_count++;
                }
            }
            console.log(App.players);
            if(correct_count == App.players.length - 1){
                $('#correct_count').html("All Players ");
            }
            else if(correct_count == 1){
                $('#correct_count').html("1 Player ");
            }
            else{
                $('#correct_count').html(correct_count + " Players ");
            }
        },
        startTimer: function(turnLength, start){
            if(App.myRole == 'Host'){
                if(!start){
                    clearInterval(ticker);
                }
                var timeInSecs = parseInt(turnLength);
                ticker = setInterval(function(){ tick(); }, 1000);
                function tick() {
                    var secs = timeInSecs;
                    if (secs>=0) {
                    timeInSecs--;
                    IO.socket.emit('broadcastTimer', App.gameID, secs);
                    //console.log('it is pushing to this room');
                    //console.log(data);
                    }
                    else {
                    //console.log('cleared?');
                    clearInterval(ticker);
                    App.startTimer(turnLength_global, true);
                    // stop counting at zero
                        // startTimer(60);  // remove forward slashes in front of startTimer to repeat if required
                    }
                }
            }
        //App.startTimer(turnLength, true);
        },
        updateTimer: function(secs){
            console.log(App.gameState);
            currentTimer = secs; //saves the current timer value in case we need to change the host in the middle of a game
            $('#timer').html(secs);
            if(secs == 0 && App.gameState == "endLobby" && App.myRole=="Host"){
                console.log('foo');
                IO.socket.emit('startGame',App.gameID);
            }  
            else if(secs == 0){
                if(App.players[turn].hasAlreadyWon == false)
                    App.players[turn].myPoints -= PointAllocation.FailDrawDeduction;
                App.gameEnded();
            }
            else if(currentTimer != turnLength_global && currentTimer % reveal_interval == 0 && App.gameRole != 'drawer'){
                //console.log("currentTimer: " + currentTimer + ' reveal_interval ' + reveal_interval + 'total_reveal_count ' + total_reveal_count);
                App.RevealLetter();
            }          
        },
        updateUserPoints: function(data){
            App.players[turn].myPoints += PointAllocation.DrawerPoints;
            App.players[turn].hasAlreadyWon = true;
            for(var i = 0; i < App.players.length; i++){
                if(App.players[i].mySocketID == data.socketID){
                    if(firstCorrectAnswer){
                        App.players[i].myPoints += PointAllocation.FirstAnswer;
                        firstCorrectAnswer = false;
                    }
                    else{
                        App.players[i].myPoints += PointAllocation.SubsequentAnswer;
                    }
                    App.players[i].hasAlreadyWon = true;
                    App.players[i].guessedCorrectly = true;
                    $("#user"+App.players[i].mySocketID).html(App.players[i].playerName+' (&#10004)');
                    $("#"+App.players[i].mySocketID+'score').html(App.players[i].myPoints);
                    $("#"+App.players[turn].mySocketID+'score').html(App.players[turn].myPoints);

                }
            }
            for(i = 0; i<App.players.length; i ++){
                if(App.players[i].hasAlreadyWon == false)
                    return;
            }
            if(App.myRole =='Host'){
                IO.socket.emit('startDrawingTimer', App.gameID, turnLength_global, false);
            }
            App.gameEnded();
        },
        updateDrawColor: function(){
            $(".palette-color").css("border-color", "#777");
            $(".palette-color").css("border-style", "solid");
            $(this).css("border-color", "#fff");
            $(this).css("border-style", "dashed");
            color = $(this).css("background-color");
            IO.socket.emit('broadcastNewColor',App.gameID, color);
        },
        updateDrawThickness: function(){
            $(".palette-thickness").css("background", "#979E71");
            $(this).css("background", "#ECF1E7");
            var drawThicknessId = $(this)[0].id;
            drawThickness = drawThicknessId.split("_")[0];
            IO.socket.emit('broadcastNewThickness',App.gameID, drawThickness);
        },
        prepareGameTutorial: function(){
            if(App.gameState !='playing'){
                displayHelp.drawer = true;
                displayHelp.guesser = true;
                displayHelp.lobby = true;
                if(App.gameState == 'home'){
                    startHomeIntro(false);
                }
                else
                    startLobbyIntro();
            }
            else{
                if(App.gameRole == 'drawer')
                    startDrawerIntro();
                else
                    startGuesserIntro();
            }

        },
        clearCanvas: function(){
            IO.socket.emit('clearCurrentCanvas',App.gameID);
        },
        recalculateDimensions: function(){
            windowSize.viewPortWidth = jQuery(window).width();
            windowSize.viewPortHeight = jQuery(window).height();
            windowSize.chatBoxWidth = $("#chat_area").width();
        },
        onUserLeave: function(){
            var userInformation = {
                SocketID: App.mySocketID,
                MyRole: App.myRole,
                MyName: App.myName,
                GameRole: App.gameRole
            };
            IO.socket.emit('playerLeft', App.gameID, userInformation);
        },
        userHasLeft: function(data){
            // console.log(data);
            // console.log(App.players);
            //removes player from the UI
            $("#" +"user"+data.SocketID ).remove();
            $("#" + data.SocketID + "score").remove();
            //remove player from global player list
            for(var i = 0; i < App.players.length; i++){
                if(App.players[i].mySocketID == data.SocketID){
                    App.players.splice(i, 1);
                }
            }
            if(data.MyRole == "Host" && App.mySocketID == App.players[0].mySocketID){
                App.myRole = "Host";
                if(App.gameState == "playing"){
                    App.startTimer(currentTimer, false);
                }
                //continues the timer where the original host left off
            }
            if(data.GameRole == "drawer" && App.myRole == "Host"){
                App.gameEnded();
                App.startTimer(turnLength_global, false);
            }
        },
        RevealLetter: function(){
            if(App.hasAlreadyWon){
                return;
            }
            var index = Math.floor(Math.random() * (letters_to_reveal.length));
            temp_hint = ConvertHintToArray(hint);
            temp_hint[letters_to_reveal[index]] = App.word[letters_to_reveal[index]];
            hint = ConvertHintToString(temp_hint);
            letters_to_reveal.splice(index, 1);
            $(drawer_word).html("Hint&nbsp;&nbsp&nbsp;" + hint);

            function ConvertHintToArray(hint_string){
                var hint_copy2 = hint_string;
                var tmp_hint = new Array();
                var hint_copy = hint_copy2.replace(/&nbsp;&nbsp;&nbsp;/gi, "%");
                console.log(hint_copy);
                for(var i = 0; i < hint_copy.length; i++){
                    if(hint_copy[i] != ' '){
                        tmp_hint.push(hint_copy[i]);
                    }
                }
                return tmp_hint;
            };
            function ConvertHintToString(hint_array){
                var tmp = "";
                for(var i = 0; i < hint_array.length; i++){
                    if(hint_array[i] == "%"){
                        tmp = tmp + "&nbsp;&nbsp;&nbsp;";
                    }
                    else{
                        tmp = tmp + hint_array[i] + " ";
                    }
                }
                return tmp;
            };
        }
    }

    IO.init();
    App.init();
