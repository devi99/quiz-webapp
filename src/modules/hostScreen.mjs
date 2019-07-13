import $ from 'jquery';
import { getSelectedOptions, score_on, score_off} from '../libs/utilitycode';
import Helpers from './helpers.mjs';

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
        this.ioClient.socket.emit('hostCreateNewGame');
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
                .append('<div id="player'+ index++ +'" class="row playerScore" data-score="0" data-playername="'+ value.playerName +'" ><span class="score"><i id="answer-icon'+ value.mySocketId +'" class="glyphicon glyphicon-question-sign"></i></span><span id="'+ value.mySocketId +'" class="score">0</span><span class="playerName">'+ value.playerName +'</span></div>');
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
                $pScore.attr('data-score', +$pScore.text() + 1);
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
            var playerObject = hostScreen.players.filter( obj => obj.mySocketId === data.playerId)[0];
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


export { HostScreen as default}