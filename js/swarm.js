/*
    Classes
 */
class Vector {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    applyVelocity(v, delta){
        //plus 1 to avoid negative numbers
        this.x = ( this.x + v.x * delta + 1) % 1;
        this.y = ( this.y + v.y * delta + 1) % 1;
    }
    addVector(vector){
        return new Vector(this.x + vector.x,this.y + vector.y)
    }
    multiplyVector(vector){
        return new Vector(
            this.x * vector.x,
            this.y * vector.y
        )
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
            (position.x <= this.center.x + this.radius.x) &&
            (position.y > this.center.y - this.radius.y) &&
            (position.y <= this.center.y + this.radius.y);
    }
    intersectsArea(area){
        return ((area.center.y - area.radius.y <= this.center.y + this.radius.y) ||
            (area.center.y + area.radius.y > this.center.y - this.radius.y))
            &&
            ((area.center.x - area.radius.x <= this.center.x + this.radius.x) ||
                (area.center.x + area.radius.x > this.center.x - this.radius.x))


    }
}
class QuadTree {
    constructor(boundary,parent = null){
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
        this.parent = parent;
    }

    drawBoundary(environment) {
        if (this.points != null) {
            environment.ctx.beginPath();
            environment.ctx.rect(
                (this.boundary.center.x - this.boundary.radius.x) * environment.scale.x,
                (this.boundary.center.y - this.boundary.radius.y) * environment.scale.y,
                this.boundary.radius.x*2 * environment.scale.x,
                this.boundary.radius.y*2 * environment.scale.y);
            environment.ctx.stroke();
        } else {
            this.northEast.drawBoundary(environment);
            this.northWest.drawBoundary(environment);
            this.southWest.drawBoundary(environment);
            this.southEast.drawBoundary(environment);
        }
    }

    insert(point){ //TODO redo
        if (Array.isArray(point)){
            for (var i = 0; i < point.length; i++) {
                this.insert(point[i]);
            }
        }else{
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
    }

    subdivide(){
        var radius = new Vector(this.boundary.radius.x/2,this.boundary.radius.y/2);
        this.northWest = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(-radius.x, radius.y)), radius),this);
        this.northEast = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(radius.x, radius.y)), radius),this);
        this.southWest = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(-radius.x, -radius.y)), radius),this);
        this.southEast = new QuadTree(
            new Area(this.boundary.center.addVector(new Vector(radius.x, -radius.y)), radius),this);

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
    constructor(environment ,p = Vector.getRandomVector() ,v = Vector.getRandomVector(-1, 1) ) {
        super(p.x,p.y);
        this.environment = environment;
        this.velocity = v;

    }
    get position(){
        return this;
    }

    update(delta){
        let speed = this.velocity.multiplyVector(this.environment.speed);
        this.position.applyVelocity(speed, delta);
    }
    get absolute(){
        return this.multiplyVector(this.environment.scale);
    }

    render() {
        if (this.environment.renderPoints){
            var absolutePosition = this.absolute;
            this.environment.ctx.fillRect(absolutePosition.x-1, absolutePosition.y-1, 3, 3);
        }

        if (this.environment.renderLines) {
            for (var j = 0; j < this.proximity.length; j++ ){
                if (this.proximity[j] === this) continue;
                var abs1 = this.absolute;
                var abs2 = this.proximity[j].absolute;

                if(this.environment.renderDistance) {
                    let dis = Math.sqrt(
                        Math.pow(abs1.x - abs2.x, 2) + Math.pow(abs1.y - abs2.y, 2)
                    );

                    dis = 1-dis/90;

                    this.environment.ctx.strokeStyle = "rgba(255,0,0,"+dis+")";
                }
                this.environment.ctx.beginPath();
                this.environment.ctx.moveTo(abs1.x, abs1.y);
                this.environment.ctx.lineTo(abs2.x, abs2.y);
                this.environment.ctx.stroke();
            }
        }
    }


}
class Timer {
    constructor(displayNode){
        this.displayNode = displayNode;
        this.displayNode.innerHTML = "Starting";
        this.reset();
    }
    reset(){
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
class Swarm {
    constructor(canvas, options){
        this.debug = options.debug || false;

        this.renderLines = options.renderLines === undefined ? true : options.renderLines;
        this.renderPoints = options.renderPoints === undefined ? true : options.renderPoints;
        this.renderDistance = options.renderDistance === undefined ? true : options.renderDistance;
        this.renderDistanceModifier = options.renderDistanceModifier || 0.6;

        this.speedVector = new Vector();
        this.speed =  options.speed || 0.0001;

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        window.onresize = this.setScale.bind(this);
        this.setScale();

        this.timer = new Timer(options.fpsDisplay);
        this.tree = new QuadTree(new Area(new Vector(0.5,0.5),new Vector(.5,.5)));


        this.particles = [];
        for (var i = 0; i < (options.particles || Math.max(Math.floor(this.scale.x * this.scale.y / 6500), 90)); i++) {
            var particle = new Particle(this);
            this.particles.push(particle);
        }

        this.start();
    }

    setScale() {
        this.scale = new Vector(window.innerWidth, window.innerHeight);
        this.canvas.width = this.scale.x;
        this.canvas.height = this.scale.y;
    }
    set speed(speed){
        this.speedVector.x = speed;
        this.speedVector.y = speed;
    }
    get speed(){
        return this.speedVector;
    }
    clearScreen(){
        this.ctx.clearRect(0,0,this.scale.x,this.scale.y);
    }
    resetStyle(){
        this.ctx.fillStyle = "#fff";
        this.ctx.strokeStyle = '#f00';
        this.ctx.strokeWidth = 1;
    }

    start(){
        if (this.running)
            console.log("already running");
        else{
            this.running = true;
            this.timer.reset();
            this.loop();
        }
    }
    loop(){
        //frame start
        this.timer.startFrameRender();

        //resetting
        this.clearScreen();
        this.resetStyle();

        //updating position
        for (let i = 0; i < this.particles.length; i++ ){
            this.particles[i].update(this.timer.delta);
        }

        //updating which particles are proximity
        this.tree = new QuadTree(this.tree.boundary);
        this.tree.insert(this.particles);

        for (let i = 0; i < this.particles.length; i++ ){
            this.particles[i].proximity = this.tree.find(new Area(this.particles[i].position, new Vector(66/this.scale.x,66/this.scale.x)));
        }


        //rendering
        if (this.debug)
            this.tree.drawBoundary(this);

        for (let i = 0; i < this.particles.length; i++ ){
            this.particles[i].render();
        }

        //frame end
        this.timer.endFrameRender();

        if (this.running)
            requestAnimationFrame(this.loop.bind(this));
    }
    stop(){
        this.running = false;
    }
}