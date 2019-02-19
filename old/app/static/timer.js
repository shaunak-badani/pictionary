//Timer 

var guessTime = 180;

const start_timer = () => {
    var tm = setInterval( () => {
        guessTime -= 1;
        if( guessTime <= 0 ) {
            show_modal();
            clearInterval(tm);
        }
        timer();
    },1000);

}
				


function timer() {
    document.querySelector('.mins').innerHTML = Math.floor(guessTime / 60);
    secs = guessTime % 60;
    document.querySelector('.secs').innerHTML = secs < 10 ? "0" + secs : secs;
}