//Timer 

var guessTime = 180;
				
setInterval( () => {
    guessTime -= 1;
    //if( guessTime <= 0 ) {
    //	leave_room();
    //}
    timer();
},1000);

function timer() {
    document.querySelector('.mins').innerHTML = Math.floor(guessTime / 60);
    secs = guessTime % 60;
    document.querySelector('.secs').innerHTML = secs < 10 ? "0" + secs : secs;
}