/*
    Classes
 */
class Particle {
    constructor() {
        this.position = Vector.getRandomVector();
        this.velocity = Vector.getRandomVector(-0.8, 0.8);
    }

    renderPosition() {
        var absolutePosition = this.position.absolute;
        ctx.fillRect(absolutePosition.x, absolutePosition.y, 1, 1);
    }

    update(delta){
        this.position.applyVelocity(this.velocity, delta);
        this.renderPosition()
    }


}
class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    get absolute(){
        return new Vector(
            this.x * scale.x,
            this.y * scale.y
        )
    }
    applyVelocity(v, delta){
        this.x = ( this.x + v.x * delta * speed) % 1;
        this.y = ( this.y + v.y * delta * speed) % 1;
    }
    static getRandomVector(min = 0, max = 1){
        return new Vector(
            min + Math.random() * ( max - min ),
            min + Math.random() * ( max - min )
        );
    }
}

/*
    Global Vars
 */
var running = false;

var particles = [];
var ctx = null;
var obj = null;
var fpsDisplay;

var scale = new Vector(500,500);

var speed = 0.0001;
var lastUpdate;

var frames = 0;
var startTime;

/*
    Function
 */
function startFPSDisplay(fpsNode) {
    fpsDisplay = fpsNode;
}
function startSwarm(canvas, particleCount) {
    ctx = canvas.getContext("2d");
    obj = canvas;


    window.onresize = setScale;
    setScale();

    for (var i = 0; i < particleCount; i++) {
        particles.push(new Particle())
    }

    startSwarmLoop();
}

function setScale() {
    scale.x = window.innerWidth;
    scale.y = window.innerHeight;
    obj.width = scale.x;
    obj.height = scale.y;

}
function startSwarmLoop() {
    if (running)
        console.log("already running");
    else{
        running = true;
        fpsDisplay.innerHTML = "starting";
        startTime = Date.now();
        lastUpdate = Date.now();
        loopSwarm();
    }
}
function stopSwarmLoop() {
    running = false;
    fpsDisplay.innerHTML = "Not running"
}
function loopSwarm() {
    var newDate = Date.now();
    var delta = newDate - lastUpdate;

    ctx.clearRect(0,0,scale.x,scale.y);
    ctx.fillStyle = "#fff";

    for (var i = 0; i < particles.length; i++ ){
        particles[i].update(delta);
    }

    lastUpdate = newDate;

    frames++;
    if (lastUpdate > startTime + 1000){
        if (fpsDisplay !== undefined)
            fpsDisplay.innerHTML =
                Math.round(frames
                    //accounting for over time
                    / ((lastUpdate-startTime)/1000));
        frames = 0;
        startTime = lastUpdate
    }

    if (running)
        requestAnimationFrame(loopSwarm)
}