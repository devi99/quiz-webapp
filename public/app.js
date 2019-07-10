/* let routes = {
    '/': homepage,
    '/portfolio': portfolio,
    '/work': work,
    '/contact': contact,
  }; */

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
        this.$templateIntroScreen = $('#intro-screen-template').html();
        this.$templateNewGame = $('#create-game-template').html();
        this.$templateStartGame = $('#start-game-template').html();
        this.$templateJoinGame = $('#join-game-template').html();
        this.$hostGame = $('#host-game-template').html();
        this.$leaderGame = $('#leaderboard-template').html();
    }

    showInitScreen() {
        
        this.$gameArea.innerHTML = document.getElementById("intro-screen-template").innerHTML;
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
        this.$gameArea.innerHTML = document.getElementById("join-game-template").innerHTML;
        let el = document.getElementById("btnStart");
        el.addEventListener("click", () => { playerScreen.onPlayerStartClick(); }, false);
        //App.Host.displayNewGameScreen();
    }

    onCreateClick() {
        console.log("Clicked Create A Game ");
        this.roleScreen = 'Host';
        // Fill the game screen with the appropriate HTML
        this.$gameArea.innerHTML = document.getElementById("create-game-template").innerHTML;
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
        this.$gameArea.innerHTML = document.getElementById("start-game-template").innerHTML;

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
        this.$gameArea.innerHTML = document.getElementById("host-game-template").innerHTML;
        
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
                .append('<div id="player'+ index++ +'" class="row playerScore"><span class="score"><i id="answer-icon'+ value.mySocketId +'" class="glyphicon glyphicon-question-sign"></i></span><span id="'+ value.mySocketId +'" class="score">0</span><span class="playerName">'+ value.playerName +'</span></div>');
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
            $('#hostMedia').html("<div class='embed-container'><iframe id='youtubeplayer' onload='setTimeout(makeVisible, 4000);' src='"+data.urlMedia+"' frameborder='0' gesture='media' allow='autoplay;encrypted-media'></iframe></div>");
        }
        $('#image').height( $(window).height() - $("#hostWord").height()- 30 );
        console.log("update the data");
        // Update the data for the current round
        hostScreen.currentCorrectAnswer = data.answer;
        hostScreen.currentRound = data.round;
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
        
        var data = {
            gameId : this.gameId,
            playerName : this.playerName
        };

        // Send the gameId and playerName to the server
        ioClient.socket.emit('playerJoinGame', data);

        // Set the appropriate properties for the current player.
        this.myRole = 'Player';
        this.myName = data.playerName;
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
        score_off();

        if (data.typeQuestion == 1){
            $list=" <div class='info'><label for='inputAnswer'>Your Answer:</label><input id='inputAnswer' type='text' /></div><button id='btnAnswer' class='btnSendAnswer btn'>SEND</button>";
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
        }

        // Insert the list onto the screen.
        $('#gameArea').html('<span id="countdownQuestion"></span><input id="inputAnswered" type="text" value="false" style="display:none" />');
        $('#gameArea').append($list);
        // Set focus on the input field.
        $('#inputAnswer').focus();

        let el = document.getElementsByClassName("btnAnswer");
        for (var i=0; i < el.length; i++) {
            let p1 = el[i].innerText;
            el[i].addEventListener("click",function() {
                playerScreen.onPlayerAnswerClick(p1);
            });
        }
        //el.addEventListener("click", () => { this.onPlayerAnswerClick(); }, false);
        el = document.getElementById("btnAnswer");
        el.addEventListener("click", () => { playerScreen.onPlayerAnswerSubmitClick() }, false);

        //var $secondsLeft = $('#countdownQuestion');

        let helpers = new Helpers();
        helpers.countDown( 'countdownQuestion', 10, function(){
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
        clearInterval(playerScreen.countdownTimer);
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
            playerId: playerScreen.mySocketId,
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
        clearInterval(playerScreen.countdownTimer);
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
            playerId: playerScreen.mySocketId,
            answer: answer,
            round: playerScreen.currentRound
        };

        ioClient.socket.emit('playerAnswer',data);
    }

}      

class IO {
    constructor() {
        this.socket = io.connect('https://qwizz-api.herokuapp.com');

        this.bindEvents();
        this.socketId;
    }

    bindEvents() {
        this.socket.on('connected', this.onConnected );
        this.socket.on('newGameCreated', this.gameInit );
        this.socket.on('playerJoinedRoom', this.playerJoinedRoom );
        this.socket.on('beginNewGame', this.beginNewGame );
        this.socket.on('newWordData', this.onNewWordData);
        // this.socket.on('hostCheckAnswer', this.hostCheckAnswer);
        // this.socket.on('gameOver', this.gameOver);
        // this.socket.on('error', this.error );
        // this.socket.on('showLeader',this.showLeader);
    }

    /**
     * The client is successfully connected!
     */
    onConnected(data) {
        // Cache a copy of the client's socket.this sessthisn ID on the App
        //App.mySocketId = this.socket.socket.sessionid;
        //App.mySocketId = this.socket.id;
        this.socketId = this.id;
        console.log(data.message + " socketId= " + this.id );            
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
}

class Helpers {
    constructor(){
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
    }

}

let ioClient = new IO();
let quiz = new Quiz(ioClient);
let hostScreen = new HostScreen(ioClient);
let playerScreen = new PlayerScreen(ioClient);
//let helpers = new Helpers();


console.log('End');