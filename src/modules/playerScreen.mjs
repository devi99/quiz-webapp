import $ from 'jquery';
import { score_off} from '../libs/utilitycode';
import Helpers from './helpers.mjs';

class PlayerScreen{
    constructor(ioClient) {
        //this.players;
        this.ioClient = ioClient;
        this.myName = '';
        this.$gameArea  = document.getElementById("gameArea");
        this.gameId = '';
        this.playerName = '';
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
            playerId: playerScreen.ioClient.socket.id,
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
            playerId: playerScreen.ioClient.socket.id,
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


export { PlayerScreen as default}