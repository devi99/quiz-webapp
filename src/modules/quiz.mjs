import $ from 'jquery';
import { setGenreOptions } from '../libs/utilitycode';
import HostScreen from './hostScreen.mjs';
import PlayerScreen from './playerScreen.mjs';
import IO from './io.mjs';

class Quiz {
    constructor() {
        //this.ioClient = ioClient;
        //this.ioClient;
        this.gameId = 0;
        this.countdownTimer = 0;
        this.roleScreen = '';
        //this.playerScreen;
        //this.hostScreen;
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
        let ioClient = new IO();
        let playerScreen = new PlayerScreen(ioClient);

        this.roleScreen = 'Player';
        this.$gameArea.innerHTML = document.getElementById("join-game-template").innerHTML;
        let el = document.getElementById("btnStart");
        el.addEventListener("click", () => { playerScreen.onPlayerStartClick(); }, false);
        //App.Host.displayNewGameScreen();
    }

    onCreateClick() {
        console.log("Clicked Create A Game ");
        let ioClient = new IO();
        let hostScreen = new HostScreen(ioClient);
        //this.ioClient.hostScreen = hostScreen;

        this.roleScreen = 'Host';
        // Fill the game screen with the appropriate HTML
        this.$gameArea.innerHTML = document.getElementById("create-game-template").innerHTML;
        setGenreOptions();
        let el = document.getElementById("btnStartGame");
        el.addEventListener("click", () => { hostScreen.processQuizInitData(); }, false);
    }

}


export { Quiz as default}
