import ServerEventsDispatcher from './libs/serverEventsDispatcher';
import 'bootstrap';
import './css/styles.css';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setGenreOptions, getSelectedOptions, score_on, score_off} from './libs/utilitycode';
import * as htmlTemplate from './html/quiz';

  (function () {
    var fullPath = window.location.pathname.substr(window.location.pathname.indexOf('/') + 1); // and split it into an array

    var pathArr = fullPath.split('/'); // check what is being requested

    console.log(pathArr); // This is the entry point of every page hit
})();

window.onpopstate = () => {
    console.log("onpopstate");
  }


class Quiz {
    constructor(ioClient) {
        this.ioClient = ioClient;
        this.gameId = 0;
        this.countdownTimer = 0;
        this.roleScreen = '';
        this.cacheElements();
        this.showInitScreen();
        this.bindEvents();
    }    

    cacheElements(){
        this.$doc = $(document);
        //this.$gameArea = $('#gameArea');
        this.$gameArea  = document.getElementById("gameArea");
        //this.$templateIntroScreen = $('#intro-screen-template').html();
        this.$templateIntroScreen = htmlTemplate.introScreenTemplate;
        this.$templateNewGame = htmlTemplate.createGameTemplate;
        this.$templateStartGame = htmlTemplate.startGameTemplate;
        this.$templateJoinGame = htmlTemplate.joinGameTemplate;
        this.$hostGame = htmlTemplate.hostGameTemplate;
        this.$leaderGame = htmlTemplate.leaderboardTemplate;
    }

    showInitScreen() {
        
        this.$gameArea.innerHTML = htmlTemplate.introScreenTemplate;
        //App.doTextFit('.title');
    }

    bindEvents () {
        // Host
        let el = document.getElementById("btnCreateGame");
        el.addEventListener("click", () => { this.onCreateClick(); }, false);
        el = document.getElementById("btnJoinGame");
        el.addEventListener("click", () => { this.onJoinClick(); }, false);
    }

    onJoinClick() {
        console.log("Clicked Join A Game ");
        this.roleScreen = 'Player';
        this.$gameArea.innerHTML = htmlTemplate.joinGameTemplate;
        let el = document.getElementById("btnStart");
        el.addEventListener("click", () => { playerScreen.onPlayerStartClick(); }, false);
        //App.Host.displayNewGameScreen();
    }

    onCreateClick() {
        console.log("Clicked Create A Game ");
        this.roleScreen = 'Host';
        // Fill the game screen with the appropriate HTML
        this.$gameArea.innerHTML = htmlTemplate.createGameTemplate;
        setGenreOptions();
        let el = document.getElementById("btnStartGame");
        el.addEventListener("click", () => { hostScreen.processQuizInitData(); }, false);
    }
}

class HostScreen{
    constructor(ioClient) {
        //this.players;
        this.ioClient = ioClient;
        this.players = Array();
        this.numPlayersInRoom = 0;
        this.gameId = 0;
        this.currentRound = 0;
        this.numAnswersGiven = 0;
        this.currentCorrectAnswer = '';
    }
    processQuizInitData(){
        this.$gameArea  = document.getElementById("gameArea");
        this.gameType = document.getElementById("gameTypes").selectedIndex;
        this.answerType = document.getElementById("answerTypes").selectedIndex
        this.numPlayersInTotal = parseInt($('#nUsers').val());
        this.numQuestions = parseInt($('#nQuestions').val());
        this.selectedGenres = getSelectedOptions(document.getElementById("selectedGenres"));

        //console.log("Clicked Start A Game with " + App.Host.gameType + App.Host.numPlayersInTotal);
        ioClient.socket.emit('hostCreateNewGame');
    }

    displayStartGameScreen(data){

        this.gameId = data.gameId;

        // Fill the game screen with the appropriate HTML
        this.$gameArea.innerHTML = htmlTemplate.startGameTemplate;

        // Display the URL on screen
        document.getElementById("gameURL").innerText = window.location.href;
        //App.doTextFit('#gameURL');

        // Show the gameId / room id on screen
        document.getElementById("spanNewGameCode").innerText = data.gameId;            
    }

    /**
     * Update the Host screen when the first player joins
     * @param serverData{{playerName: string}}
     */
    updateWaitingScreen(serverData) {
        // If this is a restarted game, show the screen.
        // if ( App.Host.isNewGame ) {
        //     App.Host.displayNewGameScreen();
        // }
        // Update host screen
        $('#playersWaiting')
            .append('<p>Player ' + serverData.playerName + ' joined the game.<p/>');

        // Store the new player's data on the Host.
        this.players.push(serverData);

        // Increment the number of players in the room
        this.numPlayersInRoom += 1;

        // If two players have joined, start the game!
        if (this.numPlayersInRoom == this.numPlayersInTotal) {
            console.log('Room is full. Almost ready!');

            var data = {
                gameId : this.gameId,
                numberOfPlayers : this.numPlayersInTotal,
                gameType: this.gameType,
                answerType: this.answerType,
                numQuestions: this.numQuestions,
                selectedGenres:this.selectedGenres
            };
            //var selGenres = ["Kids", "History"];
            //console.log(data.selectedGenres);
            //console.log(selGenres);
            // Let the server know that the players are present.
            //IO.socket.emit('hostRoomFull',App.gameId);
            ioClient.socket.emit('hostRoomFull',data);
        };

        console.log(this.numPlayersInRoom + '/' + this.numPlayersInTotal + ' in Room!');

    }

    /**
     * Show the countdown screen
     */
    gameCountdown() {

        console.log('gamecountdown started...');   
        // Prepare the game screen with new HTML
        this.$gameArea.innerHTML = htmlTemplate.hostGameTemplate;
        
        //App.doTextFit('#hostWord');

        // Begin the on-screen countdown timer
        //var $secondsLeft = $('#hostMedia');
        let tempGameId = this.gameId;
        let helpers = new Helpers();
        helpers.countDown( 'hostMedia', 5, function(){
            ioClient.socket.emit('hostCountdownFinished', tempGameId);
        });
        
        $.each(this.players, function(index,value){
            $('#playerScores')
                .append('<div id="player'+ index++ +'" class="row playerScore" data-score="0" data-playername="'+ value.playerName +'" ><span class="score"><i id="answer-icon'+ value.playerId +'" class="glyphicon glyphicon-question-sign"></i></span><span id="'+ value.playerId +'" class="score">0</span><span class="playerName">'+ value.playerName +'</span></div>');
        });

        // Set the Score section on screen to 0 for each player.
        // $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
        // $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
    }

    /**
     * Show the word for the current round on screen.
     * @param data{{round: *, word: *, subtext: *, answer: *,typeMedia: *, urlMedia: *, list: Array}}
     */
    newWord(data) {
        // Insert the new word into the DOM
        $('#hostWord').html("<h3>" + data.word + "</h3>");
        $('#hostSubText').text(data.subText);
        //App.doTextFit('#hostWord');
        //Insert the Image
        //console.log(data.typeMedia);
        if(data.typeMedia == 'pic') {
            //$('body').css('backgroundImage','url('+data.urlMedia+')');
            $('#hostMedia').html("<img id='image' class='object-fit_scale-down' src='"+data.urlMedia+"'>");
        }
        if(data.typeMedia == 'vid') {
            $('#hostMedia').html("<div class='embed-container'><iframe id='youtubeplayer' src='"+data.urlMedia+"' frameborder='0' gesture='media' allow='autoplay;encrypted-media'></iframe><div class='bar'></div></div>");
        }
        $('#image').height( $(window).height() - $("#hostWord").height()- 30 );
        console.log("update the data");
        // Update the data for the current round
        hostScreen.currentCorrectAnswer = data.answer;
        hostScreen.currentRound = data.round;
    }
    /**
     * Check the answer clicked by a player.
     * @param data{{round: *, playerId: *, answer: *, gameId: *}}
     */
    checkAnswer(data) {
        // Verify that the answer clicked is from the current round.
        // This prevents a 'late entry' from a player whos screen has not
        // yet updated to the current round.
        console.log('NumAnswersGiven=' + hostScreen.numAnswersGiven);
        console.log('currentRound=' + hostScreen.currentRound);

        if (data.round === hostScreen.currentRound){

            // Get the player's score
            var $pScore = $('#' + data.playerId);
            var $pIcon = $('#answer-icon' + data.playerId);

            //console.log($pScore);
            // Advance player's score if it is correct
            var answerGiven = data.answer.toLowerCase().replace(/\s+/g, '') ;
            var answerCorrect = hostScreen.currentCorrectAnswer.toLowerCase().replace(/\s+/g, '') ;
            if( answerCorrect === answerGiven ) {

                // Add 5 to the player's score
                $pScore.text( +$pScore.text() + 1);
                $pScore.attr('data-score', $pScore.text());
                //$pScore[0].setAttribute('data-score', $pScore.text() + 1);
                $pIcon.removeClass("glyphicon glyphicon-question-sign");
                $pIcon.removeClass("glyphicon glyphicon-remove");   
                $pIcon.addClass("glyphicon glyphicon-ok");  
                
                //Increment Answered Players
                hostScreen.numAnswersGiven +=1;

            } else {
                // A wrong answer was submitted, so decrement the player's score.
                $pScore.text( +$pScore.text());
                $pIcon.removeClass("glyphicon glyphicon-question-sign");
                $pIcon.removeClass("glyphicon glyphicon-ok");
                $pIcon.addClass("glyphicon glyphicon-remove");   
                //Increment Answered Players
                hostScreen.numAnswersGiven +=1;
            }

            // Prepare data to send to the server
            var newdata = {
                gameId : hostScreen.gameId,
                round : hostScreen.currentRound,
                gameOver: false
            }
            console.log('data.round=' + newdata.round);
            var playerObject = hostScreen.players.filter( obj => obj.playerId === data.playerId)[0];
            playerObject.playerScore++;
            //Check whether everybody answered so we can progress to the next round
            if(hostScreen.numPlayersInRoom == hostScreen.numAnswersGiven){
                $('#Answer').html('Het juiste antwoord was <b>' + hostScreen.currentCorrectAnswer + '</b>');
                console.log("Next Round !");
                // Advance the round
                hostScreen.currentRound += 1;
                newdata.round = hostScreen.currentRound;
                hostScreen.numAnswersGiven = 0;

                if(hostScreen.numQuestions == hostScreen.currentRound){
                    //IO.sockets.in(data.gameId).emit('gameOver',data);
                    //IO.socket.emit('hostGameOver',data);
                    newdata.gameOver = true;
                }
                //console.log(data);
                score_on();

                // Countdown 10 seconds for next question
                let helpers = new Helpers();
                helpers.countDown( 'countdownOverlay', 10, function(){
                    ioClient.socket.emit('hostNextRound',newdata);
                    score_off();    
                });
                
                // var $secondsLeft = $('#countdownOverlay');
                // hostScreen.countDown( $secondsLeft, 5, function(){
                //     IO.socket.emit('hostNextRound',newdata);
                //     score_off();
                // });
            }
        }
    }


    /**
     * All 10 rounds have played out. End the game.
     * @param data
     */
    endGame(data) {
        score_on();
        var scoreboard = [];
        var winnerName ='';
        var winnerScore = -1;
        
        $( ".playerScore" ).each(function( index ) { 
            console.log( index + ": " + this.children[1].getAttribute('data-score') + "&&&" + $( this ).attr('data-playername')  );
            scoreboard.push($( this ).text(),$( this ).score);
            // Find the winner based on the scores
            if (Number(this.children[1].getAttribute('data-score') ) > winnerScore){
                winnerName = $( this ).attr('data-playername') ;
                winnerScore = Number(this.children[1].getAttribute('data-score') );
            }
            });                  


        
        //Clear the Game screen
        $('#hostMedia').html("");
        $('#Answer').html('And the winner is <b>' + winnerName + '</b>');
        $('#countdownOverlay').html('with ' + winnerScore + ' points</b>');

        //App.doTextFit('#hostWord');
        //data.winner=winnerName;
        //if(data.done>0)
        //{

        //}
        //else data.done=0;
        //console.log(data);
        //IO.socket.emit("clientEndGame",data);
        // Reset game data
        //hostScreen.numPlayersInRoom = 0;
        //hostScreen.isNewGame = true;
        //IO.socket.emit('hostNextRound',data);
        // Reset game data
    }

    
}       

class PlayerScreen{
    constructor(ioClient) {
        //this.players;
        this.ioClient = ioClient;
        this.myName = '';
        this.$gameArea  = document.getElementById("gameArea");
        this.gameId = '';
        this.playerName = '';
        this.playerId = '';
        this.currentRound = 0;
        this.helpers = new Helpers();

        //this.bindEvents();

    }
    bindEvents() {
        // Player
        //App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
        //App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
        //$doc.on('click', '#btnAnswer',this.onPlayerAnswerSubmitClick);
        //App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        //App.$doc.on('click', '#leaderboard', App.onLeaderboardClick);
        //App.$doc.on('click', '#back', App.onBackClick);
    }

    onPlayerStartClick() {
        console.log('Player clicked "Start"');

        this.gameId = $('#inputGameId').val();
        this.playerName = $('#inputPlayerName').val() || 'anon';
        this.playerId = Math.floor(Math.random() * 1000);

        var data = {
            gameId : this.gameId,
            playerName : this.playerName,
            playerId : this.playerId
        };

        // Send the gameId and playerName to the server
        ioClient.socket.emit('playerJoinGame', data);

        // Set the appropriate properties for the current player.
        this.myRole = 'Player';
        
    }

     /**
     * Display the waiting screen for player 1
     * @param data
     */
    updateWaitingScreen() {

        $('#playerWaitingMessage')
        .append('<p/>')
        .text('Joined Game ' + this.gameId + '. Please wait for game to begin.');

        var elem = document.getElementById("btnStart");
        elem.remove();

    }

    /**
     * Display 'Get Ready' while the countdown timer ticks down.
     * @param hostData
     */
    gameCountdown() {
        //App.Player.hostSocketId = hostData.mySocketId;
        $('#gameArea')
            .html('<div class="gameOver">Get Ready!</div>');
    }


    /**
     * Show the list of words for the current round.
     * @param data{{round: *, word: *, answer: *, list: Array}}
     */
    newWord(data) {
        //set currentRound
        this.currentRound = data.round;

        score_off();

        $('#gameArea').html('<span id="countdownQuestion"></span><input id="inputAnswered" type="text" value="false" style="display:none" />');
            
        if (data.typeQuestion == 1){

            var $answerField = " <div class='info'><label for='inputAnswer'>Your Answer:</label><input id='inputAnswer' type='text' /></div><button id='btnAnswer' class='btnSendAnswer btn'>SEND</button>";
            $('#gameArea').append($answerField);

            // Set focus on the input field.
            $('#inputAnswer').focus();                
            let el = document.getElementById("btnAnswer");
            el.addEventListener("click", () => { playerScreen.onPlayerAnswerSubmitClick(); }, false);   

        }else{

            console.log('Create an unordered list element');
            // Create an unordered list element
            var $list = $('<ul/>').attr('id','ulAnswers');

            // Insert a list item for each word in the word list
            // received from the server.
            $.each(data.list, function(){
                $list                                //  <ul> </ul>
                    .append( $('<li/>')              //  <ul> <li> </li> </ul>
                        .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                            .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                            .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                            .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>                                                      //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            .append( $('<div/>')
                                .addClass('jtextfill')
                                .append( $('<span/>')
                                    .html(this)
                                )
                            )
                        )    
                    )
            });

            // Insert the list onto the screen.
            $('#gameArea').append($list);

            let el = document.getElementsByClassName("btnAnswer");
            for (var i=0; i < el.length; i++) {
                let p1 = el[i].innerText;
                el[i].addEventListener("click",function() {
                    playerScreen.onPlayerAnswerClick(p1);
                });
            }
        }


        //var $secondsLeft = $('#countdownQuestion');

        this.helpers.countDown( 'countdownQuestion', 20, function(){
            if($('#inputAnswered').val() == 'false'){
                if (data.typeQuestion == 1 ){
                    playerScreen.onPlayerAnswerSubmitClick();
                }else{
                    playerScreen.onPlayerAnswerClick('tooLate');
                }
            }
        });
    }

    /**
     *  Click handler for the Player hitting a word in the word list.
     */
    onPlayerAnswerClick(Answer) {
        console.log('Clicked Answer Button');

        // Stop the timer and do the callback.
        clearInterval(this.helpers.countdownTimerId);

        //var $btn = $(this);      // the tapped button
        var answer = Answer === 'tooLate' ? '' : Answer; // The tapped word

        // Replace the answers with a thank you message to prevent further answering
        $('#gameArea')
            .html('<div class="gameOver">Thanks!</div>');

        // Set the helperfield to true so we know that the user already answered     
        $('#inputAnswered').val('true');

        // Send the player info and tapped word to the server so
        // the host can check the answer.
        var data = {
            gameId: playerScreen.gameId,
            playerId: playerScreen.playerId,
            answer: answer,
            round: playerScreen.currentRound
        };
        //IO.socket.emit('playerAnswer',data);
        ioClient.socket.emit('playerAnswer',data);
    }   

    /**
     *  Click handler for the Player hitting a word in the word list.
    */
    onPlayerAnswerSubmitClick() {

        console.log('Clicked Answer Button');
        // Stop the timer and do the callback.
        clearInterval(this.helpers.countdownTimerId);

        //var $btn = $(this);      // the tapped button
        //var answer = $btn.val(); // The tapped word
        
        var answer = $('#inputAnswer').val();
        // Replace the answers with a thank you message to prevent further answering
        $('#gameArea')
            .html('<div class="gameOver">Thanks!</div>');

        // Set the helperfield to true so we know that the user already answered     
        $('#inputAnswered').val('true');

        // Send the player info and tapped word to the server so
        // the host can check the answer.
        var data = {
            gameId: playerScreen.gameId,
            playerId: playerScreen.playerId,
            answer: answer,
            round: playerScreen.currentRound
        };

        ioClient.socket.emit('playerAnswer',data);
    }

    /**
     * Show the "Game Over" screen.
     */
    endGame() {
        $('#gameArea')
            .html('<div class="gameOver">Game Over!</div>')
            .append(
                // Create a button to start a new game.
                $('<button>Start Again</button>')
                    .attr('id','btnPlayerRestart')
                    .addClass('btn')
                    .addClass('btnGameOver')
            );
    }    

}      

class IO {
    constructor() {
        this.socket = new ServerEventsDispatcher('wss://qwizz-socket.herokuapp.com');
        this.bindEvents();
        this.socketId;
    }

    bindEvents() {
        this.socket.bind('connected', this.onConnected );
        // this.socket.on('connected', this.onConnected );
        this.socket.bind('newGameCreated', this.gameInit );
        this.socket.bind('playerJoinedRoom', this.playerJoinedRoom );
        this.socket.bind('beginNewGame', this.beginNewGame );
        this.socket.bind('newWordData', this.onNewWordData);
        this.socket.bind('hostCheckAnswer', this.hostCheckAnswer);
        this.socket.bind('gameOver', this.gameOver);
        this.socket.bind('close', this.onClose );    
        // this.socket.on('error', this.error );
        // this.socket.on('showLeader',this.showLeader);
    }

    onClose(){
        this.socket.reconnect();
        //bindEvents();
    }
    /**
     * The client is successfully connected!
     */
    onConnected(data) {
        // Cache a copy of the client's socket.this sessthisn ID on the App
        //App.mySocketId = this.socket.socket.sessionid;
        //App.mySocketId = this.socket.id;
        this.socketId = data.id;
        //console.log(data.message + " socketId= " + this.id );
        console.log("connected");            
    }

    /**
     * A new game has been created and a random game ID has been generated.
     * @param data {{ gameId: int, mySocketId: * }}
     */
    gameInit(data){
        hostScreen.displayStartGameScreen(data);
        console.log('game init');
    }

    /**
     * A player has successfully joined the game.
     * @param data {{playerName: string, gameId: int, mySocketId: int}}
     */
    playerJoinedRoom(serverData) {
        console.log('playerJoinedRoom');
        // When a player joins a room, do the updateWaitingScreen funciton.
        // There are two versions of this function: one for the 'host' and
        // another for the 'player'.
        //
        // So on the 'host' browser window, the App.Host.updateWiatingScreen function is called.
        // And on the player's browser, App.Player.updateWaitingScreen is called.
        if (quiz.roleScreen == 'Host') {
            hostScreen.updateWaitingScreen(serverData);
        }else{
            playerScreen.updateWaitingScreen();
        }
    }

    /**
     * All players have joined the game.
     * @param data
     */
    beginNewGame(serverData) {
        if (quiz.roleScreen == 'Host') {
            hostScreen.gameCountdown(serverData);
        }else{
            playerScreen.gameCountdown();
        }
    }

    /**
     * A new set of words for the round is returned from the server.
     * @param data
     */
    onNewWordData(data) {
        // Update the current round
        hostScreen.currentRound = data.round;

        // Change the word for the Host and Player
        //App[App.myRole].newWord(data);
        if (quiz.roleScreen == 'Host') {
            hostScreen.newWord(data);
        }else{
            playerScreen.newWord(data);
        }
    }

    /**
     * A player answered. If this is the host, check the answer.
     * @param data
     */
    hostCheckAnswer(data) {
        if (quiz.roleScreen == 'Host') {
            hostScreen.checkAnswer(data);
        }

    }

    /**
     * Let everyone know the game has ended.
     * @param data
     */
    gameOver(data) {
        if (quiz.roleScreen == 'Host') {
            hostScreen.endGame(data);
        }else{
            playerScreen.endGame(data);
        }
    }
}

class Helpers {
    constructor(){
        this.countdownTimerId = 0;
    }

    /**
     * Display the countdown timer on the Host screen
     *
     * @param $el The container element for the countdown timer
     * @param startTime
     * @param callback The function to call when the timer ends.
     */
    countDown( el, startTime, callback) {

        // Display the starting time on the screen.
        let elem = document.getElementById(el);
        elem.innerText = this.startTime;
        //App.doTextFit('#hostWord');

        console.log('Starting Countdown...');

        // Start a 1 second timer
        let countdownTimer = setInterval(function(){
             // Decrement the displayed timer value on each 'tick'
            startTime -= 1;
            elem.innerText = startTime;
            console.log(startTime);
            if(startTime <= 0 ){
                console.log('Countdown Finished.');
    
                // Stop the timer and do the callback.
                clearInterval(countdownTimer);
                callback();
                return;
            }
        },1000);

        this.countdownTimerId = countdownTimer;
    }

}

let ioClient = new IO();
let quiz = new Quiz(ioClient);
let hostScreen = new HostScreen(ioClient);
let playerScreen = new PlayerScreen(ioClient);


console.log('End');