
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

export { Helpers as default}