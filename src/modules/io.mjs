

class IO {
    constructor() {
        this.socket = io.connect('https://qwizz-api.herokuapp.com');
        this.bindEvents();
        this.socketId;
        this.hostScreen;
        this.playerScreen;
    }

    bindEvents() {
        this.socket.on('connected', this.onConnected );
        this.socket.on('newGameCreated', this.gameInit );
        this.socket.on('playerJoinedRoom', this.playerJoinedRoom );
        this.socket.on('beginNewGame', this.beginNewGame );
        this.socket.on('newWordData', this.onNewWordData);
        this.socket.on('hostCheckAnswer', this.hostCheckAnswer);
        this.socket.on('gameOver', this.gameOver);
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

export { IO as default}
