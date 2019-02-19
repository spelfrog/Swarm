/*
    Classes
 */
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
        //plus 1 to avoid negative numbers
        this.x = ( this.x + v.x * delta * speed + 1) % 1;
        this.y = ( this.y + v.y * delta * speed + 1) % 1;
    }
    addVector(vector){
        return new Vector(this.x + vector.x,this.y + vector.y)
    }
    render() {
        var absolutePosition = this.absolute;
        ctx.fillRect(absolutePosition.x-1, absolutePosition.y-1, 3, 3);
    }
    static getRandomVector(min = 0, max = 1){
        return new Vector(
            min + Math.random() * ( max - min ),
            min + Math.random() * ( max - min )
        );
    }
}
class Area {
    constructor(center, radius){
        this.center = center;
        this.radius = radius;
    }
    containsPoint(position){
        return (position.x > this.center.x - this.radius.x) &&
            (position.x < this.center.x + this.radius.x) &&
            (position.y > this.center.y - this.radius.y) &&
            (position.y < this.center.y + this.radius.y);
    }
    intersectsArea(area){
        return ((area.center.y - area.radius.y < this.center.y + this.radius.y) ||
            (area.center.y + area.radius.y > this.center.y - this.radius.y))
            &&
            ((area.center.x - area.radius.x < this.center.x + this.radius.x) ||
                (area.center.x + area.radius.x > this.center.x - this.radius.x))


    }
}
class QuadTree {
    constructor(boundary){
        // Fields

        /** 0 X
         * 0 0 */
        this.northEast = null;
        /** 0 0
         * X 0 */
        this.southWest = null;
        /** X 0
         * 0 0 */
        this.northWest = null;
        /** 0 0
         * 0 X */
        this.southEast = null;

        this.points = [];
        this.MAX_POINTS_IN_AREA = 4;

        this.boundary = boundary;
    }

    drawBoundary() {
        if (this.points != null) {
            ctx.rect(
                (this.boundary.center.x - this.boundary.radius.x) * scale.x,
                (this.boundary.center.y - this.boundary.radius.y) * scale.y,
                this.boundary.radius.x*2 * scale.x,
                this.boundary.radius.y*2 * scale.y);
            ctx.stroke();
        } else {
            this.northEast.drawBoundary();
            this.northWest.drawBoundary();
            this.southWest.drawBoundary();
            this.southEast.drawBoundary();
        }
    }

    insert(point){ //TODO redo
        if (!this.boundary.containsPoint(point))
            return false;

        if (this.points != null && this.points.length < this.MAX_POINTS_IN_AREA){
            this.points.push(point);
            return true;
        }else if (this.points != null)
            this.subdivide();

        if (this.northWest.insert(point)) return true;
        if (this.northEast.insert(point)) return true;
        if (this.southWest.insert(point)) return true;
        if (this.southEast.insert(point)) return true;

        alert("Fatal error!");
    }

    subdivide(){
        var radius = new Vector(this.boundary.radius.x/2,this.boundary.radius.y/2);
        this.northWest = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(-radius.x, radius.y)), radius));
        this.northEast = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(radius.x, radius.y)), radius));
        this.southWest = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(-radius.x, -radius.y)), radius));
        this.southEast = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(radius.x, -radius.y)), radius));

        for (var i = 0; i < this.points.length; i++){
            var point = this.points[i];

            if (this.northWest.insert(point)) continue;
            else if (this.northEast.insert(point)) continue;
            else if (this.southWest.insert(point)) continue;
            else if (this.southEast.insert(point)) continue;
            else alert("error")
        }
        this.points = null;
    }

    find(area){
        var points = [];

        //quit if wrong area
        if (!this.boundary.intersectsArea(area)) return points;

        if (this.points != null){
            for (var i = 0;i < this.points.length;i++){
                var point = this.points[i];

                if (area.containsPoint(point)) points.push(point);
            }
        }else{
            points = this.northWest.find(area);
            points = points.concat(this.northEast.find(area));
            points = points.concat(this.southEast.find(area));
            points = points.concat(this.southWest.find(area));
        }

        return points;
    }
}
class Particle extends Vector{
    constructor(p = Vector.getRandomVector() ,v = Vector.getRandomVector(-1, 1) ) {
        super(p.x,p.y);
        this.velocity = v;

    }
    get position(){
        return this;
    }

    update(delta){
        this.position.applyVelocity(this.velocity, delta);
    }


}
class Timer {
    constructor(displayNode){
        this.displayNode = displayNode;
        this.displayNode.innerHTML = "Starting";
        this.lastDisplayFPSUpdate = Date.now();
        this.lastFrameStart = Date.now();
        this.framesCountedSinceLastDisplayUpdate = 0;
    }
    startFrameRender(){
        var newDate = Date.now();
        this.delta = newDate - this.lastFrameStart;
        this.lastFrameStart = newDate;
        this.framesCountedSinceLastDisplayUpdate++;
        return this.delta;
    }
    endFrameRender(){
        this.frameTime = Date.now() - this.lastFrameStart;
        this.updateFPSDisplay();
    }
    updateFPSDisplay(){
        if (this.lastFrameStart > this.lastDisplayFPSUpdate + 1000){
            if (this.displayNode !== undefined)
                this.displayNode.innerHTML =
                    Math.round(this.framesCountedSinceLastDisplayUpdate
                        //accounting for over time
                        / ((this.lastFrameStart-this.lastDisplayFPSUpdate)/1000));
            this.framesCountedSinceLastDisplayUpdate = 0;
            this.lastDisplayFPSUpdate = this.lastFrameStart
        }
    }
}

/*
    Global Vars
 */
var running = false;

var particles = [];
var ctx = null;
var obj = null;

var scale = new Vector(500,500);

var speed = 0.0001;
var timer;

/*
    Function
 */
function startSwarm(canvas, particleCount, fpsDisplay = undefined) {
    timer = new Timer(fpsDisplay);

    ctx = canvas.getContext("2d");
    obj = canvas;


    window.onresize = setScale;
    setScale();

    for (var i = 0; i < particleCount; i++) {
        particles.push(new Particle());
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
        loopSwarm();
    }
}
function stopSwarmLoop() {
    running = false;
}
function loopSwarm() {
    timer.startFrameRender();

    ctx.clearRect(0,0,scale.x,scale.y);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = '#f00';
    ctx.strokeWidth = 1;

    var tree = new QuadTree(new Area(new Vector(0.5,0.5),new Vector(.5,.5)));
    for (var i = 0; i < particles.length; i++ ){
        particles[i].update(timer.delta);
        tree.insert(particles[i]);
    }

    for (var i = 0; i < particles.length; i++ ){
        //render point
        particles[i].render();

        //render lines
        var points = tree.find(new Area(particles[i].position, new Vector(66/scale.x,66/scale.y)));
        for (var j = 0; j < points.length; j++ ){
            if (particles[i] === points[j]) continue;
            var abs1 = particles[i].position.absolute;
            var abs2 = points[j].absolute;
            ctx.beginPath();
            ctx.moveTo(abs1.x, abs1.y);
            ctx.lineTo(abs2.x, abs2.y);
            ctx.stroke();
        }
    }

    timer.endFrameRender();

    if (running)
        requestAnimationFrame(loopSwarm)
}