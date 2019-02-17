/*
    Classes
 */
class Particle {
    constructor() {
        this.position = Vector.getRandomVector();
        this.velocity = Vector.getRandomVector(0.2, 0.8);

        this.svg = document.createElementNS("http://www.w3.org/2000/svg","circle");
        this.svg.setAttribute("r","2");
        this.renderPosition();
        parentSVG.appendChild(this.svg);
    }

    renderPosition() {
        var absolutePosition = this.position.absolute;
        this.svg.setAttribute("cx", absolutePosition.x);
        this.svg.setAttribute("cy", absolutePosition.y);
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

var particles = [];
var parentSVG = null;

var scale = new Vector(500,500);

var speed = 0.001;
var lastUpdate = Date.now();


/*
    Function
 */

function startSwarm(svg, particleCount) {
    parentSVG = svg;

    window.onresize = setScale;
    setScale();

    for (var i = 0; i < particleCount; i++) {
        particles.push(new Particle())
    }

    loopSwarm();
}

function setScale() {
    scale.x = window.innerWidth;
    scale.y = window.innerHeight;
}

function loopSwarm() {
    var newDate = Date.now();
    var delta = newDate - lastUpdate;

    for (var i = 0; i < particles.length; i++ ){
        particles[i].update(delta);
    }

    lastUpdate = newDate;
    requestAnimationFrame(loopSwarm)
}