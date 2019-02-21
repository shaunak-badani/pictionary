//Timer 

var guessTime = 180;

var tm;

const start_timer = () => {
    tm = setInterval( () => {
        guessTime -= 1;
        if( guessTime <= 0 ) {
            show_modal();
            clearInterval(tm);
        }
        timer();
    },1000);

}

const clearTimer = () => {
    clearInterval(tm);
}
				


function timer() {
    document.querySelector('.mins').innerHTML = Math.floor(guessTime / 60);
    secs = guessTime % 60;
    document.querySelector('.secs').innerHTML = secs < 10 ? "0" + secs : secs;
}