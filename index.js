let $ = Math.PI;

window.onload = () => {
    let canvas = document.querySelector('canvas');
    let ctx = canvas.getContext('2d');
    let centre = {x: 0, y: 0};
    let vmin = 0;

    initialise();

    function testdraw(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(centre.x, centre.y, 100, 0, 2*$);
        ctx.stroke();
    }

    function initialise(){
        canvas.setAttribute('width', window.innerWidth);
        canvas.setAttribute('height', window.innerHeight);
        centre = {x: canvas.width/2, y: canvas.height/2};
        vmin = Math.min(canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener('resize', () => {
        initialise();
    });

    class Scene{
        meshes = [];
        cameras = [];
        fps = 0;

        constructor(meshes = []){
            this.meshes = meshes;
        }

        addMeshes(...meshes) {
            for(const mesh of meshes){
                this.meshes.push(mesh);
            }
        }

        removeMeshes(...meshes) {
            for(const mesh of meshes){
                this.meshes.splice(this.meshes.indexOf(mesh), 1);
            }
        }

        printMeshes(){
            for(const mesh of this.meshes){
                console.log(mesh);
            }
        }

        render(){
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for(const mesh of this.meshes){
                mesh.render();
            }
            ctx.fillStyle = '#fff';
            ctx.font = "20px Arial";
            ctx.fillText(`FPS: ${this.fps}`, 0.9*canvas.width, 0.1*canvas.height);
        }
    }

    class Mesh{
        position = {
            x: 0,
            y: 0,
            z: 0
        }

        points = [];
        edges = [];

        constructor(points = [], edges = []){
            this.points = points;
            this.addEdges(edges);
        }

        addEdges(edges){
            for(const edge of edges){
                this.addEdge(edge[0], edge[1], edge[2]);
            }
            console.log(this.edges);
        }

        addEdge(p1ID, p2ID, colour = '#fff', width = 2){
            this.edges.push({p1: this.points[p1ID], p2: this.points[p2ID], colour: colour, width: width});
        }

        render(){
            ctx.beginPath();
            for(const edge of this.edges){
                ctx.beginPath();
                //ctx.strokeStyle = edge.colour;
                // ctx.strokeStyle = `hsl(${Math.round(Math.random()*360)}, 100%, 50%)`;
                ctx.lineWidth = edge.width;

                ctx.moveTo(edge.p1.x, edge.p1.y);
                ctx.lineTo(edge.p2.x, edge.p2.y);
                ctx.closePath();
                ctx.stroke();
            }
        }

        translate(x, y){
            for(const point of this.points){
                point.x += x;
                point.y += y;
            }
        }
    }

    let mesh = new Mesh(
        [
            {x: 100, y: 100},
            {x: 200, y: 100},
            {x: 200, y: 200},
            {x: 100, y: 200},
            {x: 130, y: 130},
            {x: 230, y: 130},
            {x: 230, y: 230},
            {x: 130, y: 230}
        ],
        [
            [0, 1, `hsl(${Math.round(Math.random()*360)}, 100%, 100%)`],
            [1, 2],
            [2, 3],
            [3, 0],
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7],
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4]
        ]
    );
    let scene = new Scene([mesh]);

    let oldtime = 0;
    let counter = 0
    mesh.translate(800, 400);
    function play(time){
        let deltatime = time - oldtime;
        oldtime = time;
        scene.fps = Math.round(1000/deltatime);
        ctx.strokeStyle = `hsl(${Math.round(time/5 % 360)}, 100%, 50%)`;
        // if(time - counter > 100) {
        //     ctx.strokeStyle = `hsl(${Math.round(Math.random()*360)}, 100%, 50%)`;
        //     counter = time;
        // }
        scene.render();
        mesh.translate(Math.sin(time/100)*2, -Math.cos(time/100)*2);
        // requestAnimationFrame(play);
    }

    play(0);
}