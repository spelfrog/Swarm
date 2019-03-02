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
        this.x = ( this.x + v.x * delta);
        this.y = ( this.y + v.y * delta);
    }
    addVector(vector){
        return new Vector(this.x + vector.x,this.y + vector.y)
    }
    subtractVector(vector){
        return new Vector(this.x - vector.x,this.y - vector.y)
    }
    getLength(){
        // noinspection JSSuspiciousNameCombination
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2))
    }
    getDistance(vector){
        return this.subtractVector(vector).getLength();
    }
    normalise(){
        return this.scaleVector(1/this.getLength())
    }
    multiplyVector(vector){
        return new Vector(
            this.x * vector.x,
            this.y * vector.y
        )
    }
    scaleVector(s){
        return this.multiplyVector(new Vector(s,s))
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

            if (!this.northWest.insert(point)
                && !this.northEast.insert(point)
                && !this.southWest.insert(point)
                && !this.southEast.insert(point))
                alert("error")
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
    constructor(environment ,p = Vector.getRandomVector()) {
        super(p.x,p.y);
        this.environment = environment;
    }

    get position(){
        return this;
    }

    get absolute(){
        return this.multiplyVector(this.environment.scale);
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
    /**
     * @param canvas {HTMLElement} the canvas element
     * @param options {object} is a object with various options:
     *      debug {bool}
     *          draw quad tree areas
     *      speed {float}
     *          particle moment speed modifier
     *      particlePlugins {Array}
     *          a Array of ParticlePlugins
     *      fpsDisplay {HTMLElement}
     *          a element to insert the the current fps rate
     *      particles {int}
     *          the number of particles
     */
    constructor(canvas, options){
        this.debug = options.debug || false;

        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        window.onresize = this.setScale.bind(this);
        this.setScale();

        this.speedVector = new Vector();
        this.speed =  options.speed || 1/Math.max(this.scale.x,this.scale.y)/15;

        this.timer = new Timer(options.fpsDisplay);
        this.tree = new QuadTree(new Area(new Vector(0.5,0.5),new Vector(.5,.5)));


        this.particles = [];
        for (var i = 0; i < (options.particles || Math.max(Math.floor(this.scale.x * this.scale.y / 6500), 90)); i++) {
            var particle = new Particle(this);
            this.particles.push(particle);
        }

        let plugins = options.particlePlugins || [
            new NewtonianMotion(this),
            new PointRenderer(this),
            new LineRenderer(this),
            new LimitSpace(this),
        ];

        this.particlePlugins = [];
        for (let i = 0; i < plugins.length; i++) {
            this.addParticlePlugin(plugins[i]);
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

    addParticlePlugin(plugin){
        if (this.particlePlugins === undefined)
            this.particlePlugins = [];

        plugin.checkRequirements();
        this.particlePlugins.push(plugin);

        for (let i = 0; i < this.particles.length; i++) {
            plugin.initialiseParticle(this.particles[i])
        }
        return this;
    }
    enableParticlePlugin(pluginName){
        this.getParticlePlugin(pluginName).enable();
    }
    disableParticlePlugin(pluginName){
        this.getParticlePlugin(pluginName).disable();
    }
    getParticlePlugin(pluginName){
        for (let i = 0; i < this.particlePlugins.length; i++) {
            if (this.particlePlugins[i].name === pluginName)
                return this.particlePlugins[i];
        }
    }

    clearScreen(){
        this.ctx.clearRect(0,0,this.scale.x,this.scale.y);
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

        //updating position
        for (let p = 0; p < this.particlePlugins.length; p++) {
            if (this.particlePlugins[p].status)
                for (let i = 0; i < this.particles.length; i++ ){
                    this.particlePlugins[p].updatePosition(this.particles[i])
                }
        }

        //updating which particles are in proximity
        this.tree = new QuadTree(this.tree.boundary);
        this.tree.insert(this.particles);
        for (let i = 0; i < this.particles.length; i++ ){
            this.particles[i].proximity = this.tree.find(new Area(this.particles[i].position, new Vector(100/this.scale.x,100/this.scale.x)));
        }

        //updating Velocity
        for (let p = 0; p < this.particlePlugins.length; p++) {
            if (this.particlePlugins[p].status)
                for (let i = 0; i < this.particles.length; i++ ){
                    this.particlePlugins[p].updateProperties(this.particles[i], this.particles[i].proximity)
                }
        }


        //rendering
        if (this.debug)
            this.tree.drawBoundary(this);

        for (let p = 0; p < this.particlePlugins.length; p++) {
            if (this.particlePlugins[p].status)
                for (let i = 0; i < this.particles.length; i++ ){
                    this.particlePlugins[p].render(this.particles[i], this.particles[i].proximity)
                }
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

/*
    ParticlePlugin
 */
class ParticlePlugin {
    /**
     * Use the constructor is a good place to supply settings for rendering and calculations
     * @param context {Swarm} general information about the world
     * @param status {Boolean} true enables the plugin false disables the plugin
     * @param name {String} unique name for Requirements checking
     */

    constructor(context, status = true, name = this.constructor.name){
        this.context = context;
        this.status = status;
        this.name = name
    }

    /**
     * Use this function to define requirement's using the requiresPlugin function
     */
    checkRequirements(){
        return true;
    }

    /**
     * Use this function to add variables to particles needed in your further calculations like velocity
     * @param particle {Particle} to update
     */
    initialiseParticle(particle){

    }

      /**
     * Use this function to render particles and interactions with other particles
     * The function is call once for each particles
     * @param particle {Particle} to update
     * @param proximityParticles {array} other particles in the vicinity
     */
    render(particle, proximityParticles){

    }

    /**
     * Use this function to apply calculated values from updateProperties to position
     * @param particle {Particle} to update
     */
    updatePosition(particle){

    }

    /**
     * Use this function to calculate particle properties like velocity
     * @param particle {Particle} to update
     * @param proximityParticles {array} other particles in the vicinity
     */
    updateProperties(particle, proximityParticles){

    }

    requiresPlugin(pluginName){
        for (let i = 0; i < this.context.particlePlugins.length; i++) {
            if (this.context.particlePlugins[i].name === pluginName) return true;
        }

        throw (this.name + " requires Plugin " + pluginName);
    }
    get isEnabled(){
        return this.status;
    }
    disable(){
        this.status = false;
    }
    enable(){
        this.status = true;
    }
}
class NewtonianMotion extends ParticlePlugin{
    initialiseParticle(particle){
        particle.velocity = Vector.getRandomVector(-1,1);
    }
    updatePosition(particle){
        let speed = particle.velocity.multiplyVector(this.context.speed);
        particle.position.applyVelocity(speed, this.context.timer.delta);
    }
}
class LimitSpace extends ParticlePlugin{
    updatePosition(particle){
        particle.x = (particle.x + 1) % 1;
        particle.y = (particle.y + 1) % 1;
    }
}
class PointRenderer extends ParticlePlugin{
    constructor(context, status = undefined, name = undefined, fillStyle = '#fff'){
        super(context, status, name);
        this.fillStyle = fillStyle;

    }
    render(particle, proximityParticles){
        this.context.ctx.fillStyle = this.fillStyle;
        let absolutePosition = particle.absolute;
        this.context.ctx.fillRect(absolutePosition.x-1, absolutePosition.y-1, 3, 3);
    }
}
class LineRenderer extends ParticlePlugin{
    constructor(context, status = undefined, name = undefined, lineRed = 0, lineGreen = 255, lineBlue = 0, lineWidth = 2){
        super(context, status, name);
        this.setLineStyle(lineBlue, lineGreen, lineBlue);
        this.lineWidth = lineWidth;
    }
    setLineStyle(red, green, blue){
        this.style = red + "," + green + "," + blue
    }
    render(particle, proximityParticles){
        this.context.ctx.strokeWidth = this.lineWidth;

        for (let j = 0; j < proximityParticles.length; j++ ){
            //don't draw line to this
            if (proximityParticles[j] === particle) continue;
            //draw line only once
            if (particle.x>proximityParticles[j].x) continue;

            //get line start and end point
            let abs1 = particle.absolute;
            let abs2 = proximityParticles[j].absolute;

            //calculate line transparency dependent on line length
            let dis = Math.sqrt(
                Math.pow(abs1.x - abs2.x, 2) + Math.pow(abs1.y - abs2.y, 2)
            );
            dis = 1-dis/90;

            //setting line color
            this.context.ctx.strokeStyle = "rgba("+this.style+","+dis+")";

            //drawing line
            this.context.ctx.beginPath();
            this.context.ctx.moveTo(abs1.x, abs1.y);
            this.context.ctx.lineTo(abs2.x, abs2.y);
            this.context.ctx.stroke();
        }
    }
}
class CenterGravity extends ParticlePlugin{
    constructor(context, status = undefined, name = undefined, gravityWellPosition = new Vector(0.5,0.5)){
        super(context, status, name);
        this.gravityWellPosition = gravityWellPosition;
    }
    checkRequirements(){
        this.requiresPlugin("NewtonianMotion");
    }
    updateProperties(particle, proximityParticles){
        particle.velocity = particle.velocity.addVector(this.gravityWellPosition.subtractVector(particle.position).scaleVector(.01));
    }
}
class ParticleAttraction extends ParticlePlugin{
    checkRequirements(){
        this.requiresPlugin("NewtonianMotion");
    }
    updateProperties(particle, proximityParticles){
        for (let j = 0; j < proximityParticles.length; j++ ) {
            if (proximityParticles[j] === particle) continue;

            particle.velocity = particle.velocity.addVector(
                proximityParticles[j].subtractVector(particle)
                    .normalise()
                    .scaleVector(1/Math.pow(particle.getDistance(proximityParticles[j])+1,2)*0.005)
            )
        }


    }
}
class ParticleSpeedLimit extends ParticlePlugin{
    constructor(context, status = undefined, name = undefined, speedLimit = 3){
        super(context, status, name);
        this.speedLimit = speedLimit;
    }
    checkRequirements(){
        this.requiresPlugin("NewtonianMotion");
    }
    updateProperties(particle, proximityParticles){
        particle.velocity.x = Math.min(this.speedLimit, Math.max(-this.speedLimit, particle.velocity.x));
        particle.velocity.y = Math.min(this.speedLimit, Math.max(-this.speedLimit, particle.velocity.y));
    }
}
class LineToMouseRenderer extends LineRenderer{
    constructor(context, status = undefined, name = undefined, lineRed = undefined, lineGreen = undefined, lineBlue = undefined, lineWidth = undefined){
        super(context, status, name, lineRed, lineGreen, lineBlue, lineWidth);
        //todo create global vector for find radius
        this.area = new Area(new Vector(),new Vector(100/this.context.scale.x,100/this.context.scale.x));

        context.canvas.addEventListener("mousemove",function (e) {
            this.area.center.x = e.clientX/this.context.scale.x;
            this.area.center.y = e.clientY/this.context.scale.y;
        }.bind(this));

        this.rendered = false;
    }
    updatePosition(particle) {
        this.rendered = false;
    }
    render(particle, proximityParticles) {
        //render lines to mouse only once not on each particle
        if (!this.rendered) {
            let prox = this.context.tree.find(this.area);
            let mouse = new Particle(this.context, this.area.center);

            super.render(mouse, prox);

            //subverting optimisation from LineRenderer
            let mouseAsArray = [mouse];
            for (let i = 0; i < prox.length; i++) {
                super.render(prox[i], mouseAsArray);
            }

            this.rendered = true;
        }
    }
}