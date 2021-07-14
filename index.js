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
        currentcam = 0;
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
                mesh.render(this.cameras[this.currentcam]);
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
        proj = [];
        edges = [];

        constructor(points = [], edges = []){
            this.points = points;
            this.addEdges(edges);
        }

        addEdges(edges){
            for(const edge of edges){
                this.addEdge(edge[0], edge[1], edge[2]);
            }
            //console.log(this.edges);
        }

        addEdge(p1ID, p2ID, colour = '#fff', width = 3){
            this.edges.push({p1: p1ID, p2: p2ID, colour: colour, width: width});
        }

        render(camera){
            this.project(camera);
            //console.log(this.proj);
            ctx.beginPath();
            for(const edge of this.edges){
                let p1 = this.proj[edge.p1];
                let p2 = this.proj[edge.p2];
                let p1v, p2v, pv;
                if(p1.off && p2.off) continue;
                if(p1.off){
                    //handle p2
                    p1v = new Vec3(this.points[edge.p1].x, this.points[edge.p1].y, this.points[edge.p1].z);
                    p2v = new Vec3(this.points[edge.p2].x, this.points[edge.p2].y, this.points[edge.p2].z);
                    pv = p2v.clone();
                    pv.sub(p1v);
                    p1 = camera.intersection(camera.lpos, camera.lens, p2v, pv);
                    p1 = camera.project(p1);
                }
                if(p2.off){
                    //handle p1
                    p1v = new Vec3(this.points[edge.p1].x, this.points[edge.p1].y, this.points[edge.p1].z);
                    p2v = new Vec3(this.points[edge.p2].x, this.points[edge.p2].y, this.points[edge.p2].z);
                    pv = p1v.clone();
                    pv.sub(p2v);
                    p2 = camera.intersection(camera.lpos, camera.lens, p1v, pv);
                    p2 = camera.project(p2);
                }
                ctx.beginPath();
                //ctx.strokeStyle = edge.colour;
                // ctx.strokeStyle = `hsl(${Math.round(Math.random()*360)}, 100%, 50%)`;
                ctx.lineWidth = edge.width;
                ctx.moveTo((p1.xper * canvas.width) + centre.x, (-p1.yper * canvas.height) + centre.y);
                ctx.lineTo((p2.xper * canvas.width) + centre.x, (-p2.yper * canvas.height) + centre.y);
                // ctx.moveTo((p1.x * 500) + centre.x, (p1.y * -500) + centre.y);
                // ctx.lineTo((p2.x * 500) + centre.x, (p2.y * -500) + centre.y);

                // ctx.moveTo(p1.x*100, p1.y * 100);
                // ctx.lineTo(p2.x*100, p2.y * 100);
                ctx.closePath();
                ctx.stroke();
            }
        }

        project(camera){
            this.proj = [];
            for(const p of this.points){
                this.proj.push(camera.project(p));
            }
        }

        translate(x, y, z){
            for(const point of this.points){
                point.x += x;
                point.y += y;
                point.z += z;
            }
        }

        rotate(rad){

        }
    }

    class Camera{
        core = new Vec3(0, 0, 0);
        lens = new Vec3(0, 0, 1);
        lpos = new Vec3(0, 0, 1);
        ybasis = new Vec3(0, 1, 0);
        xbasis = new Vec3(1, 0, 0);

        fov = 90;
        zoom = 8;
        width = 2 * Math.tan(degToRad(this.fov/2));
        height = (canvas.height/canvas.width) * this.width;

        intersection(planepoint, planenormal, linepoint, linedirection){
            linedirection.normalise();
            let t1 = planenormal.dot(linedirection);
            if(t1 == 0) return linepoint;
            else {
                let t2 = planenormal.dot(planepoint);
                let t3 = planenormal.dot(linepoint);
                let t4 = planenormal.dot(linedirection);
                let t = (t2 - t3) / t4;
                linedirection.mul(t);
                linepoint.add(linedirection);
                return linepoint;
            }
        }

        translate(x, y, z){
            this.core.x += x;
            this.core.y += y;
            this.core.z += z;
            this.lpos = this.core.clone();
            this.lpos.add(this.lens);
        }

        rotate(theta){
            let c = this.lens.clone();
            let x = c.x;
            let y = c.y;
            let z = c.z;
            c.x = (x * Math.cos(theta)) + (z * Math.sin(theta));
            c.z = (-x * Math.sin(theta)) + (z * Math.cos(theta));
            this.lens = c;

            let c1 = this.xbasis.clone();
            let x1 = c1.x;
            let y1 = c1.y;
            let z1 = c1.z;
            c1.x = (x1 * Math.cos(theta)) + (z1 * Math.sin(theta));
            c1.z = (-x1 * Math.sin(theta)) + (z1 * Math.cos(theta));
            this.xbasis = c1;

            let c2 = this.ybasis.clone();
            let x2 = c2.x;
            let y2 = c2.y;
            let z2 = c2.z;
            c2.x = (x2 * Math.cos(theta)) + (z2 * Math.sin(theta));
            c2.z = (-x2 * Math.sin(theta)) + (z2 * Math.cos(theta));
            this.ybasis = c2;

            this.lpos = this.core.clone();
            this.lpos.add(this.lens);
        }

        project(p){
            //console.log(p);
            let d = distance(p, this.lpos);
            let dtest = distance(p, this.core);
            let off = dtest < d;
            if(off) return {off: true}
            //else{
            let pv = new Vec3(p.x, p.y, p.z);
            let linedirection = this.core.clone();
            // if(off){
            //     let cl = this.lens.clone();
            //     cl.mul(1e8);
            //     linedirection.add(cl);
            // }
            linedirection.sub(pv);
            let pp = this.intersection(this.lpos, this.lens, pv, linedirection);
            if(pp == null) return pp;
            pp.sub(this.core)
            pp.off = off;
            //test clipping
            let ppx = pp.clone();
            let ppy = pp.clone();
            let dx = ppx.dot(this.xbasis);
            let dy = ppy.dot(this.ybasis);
            // pp.xper = dx/this.width;
            // pp.yper = dy/this.height;
            pp.xper = (dx/this.width);
            pp.yper = (dy/this.height);
            //if( dx > this.width/2 || dy > this.height/2) pp.off = true;
            //console.log(pp);
            return pp;
            //}

            // let d = distance(p, this.lens);
            // let factor = 100;
            // let dtest = distance(p, this.core);
            // let off = dtest < d;
            // // let test = {
            // //     x: p.x - this.lens.x,
            // //     y: p.y - this.lens.y,
            // //     z: p.z - this.lens.z
            // // }
            // let test = distance(this.lens, this.core);
            // let hmm = test/dtest;
            // return{
            //     x: (this.core.x - p.x) * hmm * this.fov,
            //     y: (this.core.y - p.y) * hmm * this.fov,
            //     off: off
            // }
        }

        constructor(){
            // this.core = {
            //     x: 0,
            //     y: 0,
            //     z: 50
            // }
    
            // this.lens = {
            //     x: 0,
            //     y: 0,
            //     z: 0
            // }
        }
    }

    class Vec3{
        x = 0;
        y = 0;
        z = 0;

        constructor(x = 0, y = 0, z = 0){
            this.x = x;
            this.y = y;
            this.z = z;
        }

        add(v){
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
        }

        sub(v){
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
        }

        addp(x, y, z){
            this.x += x;
            this.y += y;
            this.z += z;
        }

        subp(x, y, z){
            this.x -= x;
            this.y -= y;
            this.z -= z;
        }

        mul(n){
            this.x *= n;
            this.y *= n;
            this.z *= n;
        }

        mulv(v){
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
        }

        div(n){
            this.x /= n;
            this.y /= n;
            this.z /= n;
        }

        mag(){
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
        }

        normalise(){
            this.div(this.mag());
        }

        clone(){
            return new Vec3(this.x, this.y, this.z);
        }

        dot(v){
            return (this.x * v.x) + (this.y * v.y) + (this.z * v.z);
        }
    }

    function distance(p1, p2){
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
    }

    function degToRad(x){
        return x * ($ / 180);
    }

    function radToDeg(x){
        return x * (180 / $)
    }

    let mesh = new Mesh(
        // [
        //     {x: 100, y: 100, z: 50},
        //     {x: 200, y: 100, z: 50},
        //     {x: 200, y: 200, z: 50},
        //     {x: 100, y: 200, z: 50},
        //     {x: 100, y: 100, z: 150},
        //     {x: 200, y: 100, z: 150},
        //     {x: 200, y: 200, z: 150},
        //     {x: 100, y: 200, z: 150}
        // ],
        [
            {x: -1, y: -1, z: 2},
            {x: 1, y: -1, z: 2},
            {x: 1, y: 1, z: 2},
            {x: -1, y: 1, z: 2},
            {x: -1, y: -1, z: 4},
            {x: 1, y: -1, z: 4},
            {x: 1, y: 1, z: 4},
            {x: -1, y: 1, z: 4}
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
    let mesh2 = new Mesh(
        [
            {x: 1, y: 1, z: 2},
            {x: 1, y: 1, z: 4},
            {x: -1, y: 1, z: 4},
            {x: -1, y: 1, z: 2},
            {x: 0, y: 2, z: 3}
        ],
        [
            [0, 1, `hsl(${Math.round(Math.random()*360)}, 100%, 100%)`],
            [1, 2],
            [2, 3],
            [3, 0],
            [0, 4],
            [1, 4],
            [2, 4],
            [3, 4]
        ]
    );
    let mesh3 = new Mesh(
        [
            {x: -5, y: -1, z: -5},
            {x: 5, y: -1, z: -5},
            {x: 5, y: -1, z: 5},
            {x: -5, y: -1, z: 5},
            {x: -4, y: -1, z: -5},
            {x: -4, y: -1, z: 5},
            {x: -3, y: -1, z: -5},
            {x: -3, y: -1, z: 5},
            {x: -2, y: -1, z: -5},
            {x: -2, y: -1, z: 5},
            {x: -1, y: -1, z: -5},
            {x: -1, y: -1, z: 5},
            {x: 0, y: -1, z: -5},
            {x: 0, y: -1, z: 5},
            {x: 1, y: -1, z: -5},
            {x: 1, y: -1, z: 5},
            {x: 2, y: -1, z: -5},
            {x: 2, y: -1, z: 5},
            {x: 3, y: -1, z: -5},
            {x: 3, y: -1, z: 5},
            {x: 4, y: -1, z: -5},
            {x: 4, y: -1, z: 5},
            
        ],
        [
            [0, 1, `hsl(${Math.round(Math.random()*360)}, 100%, 100%)`],
            [1, 2],
            [2, 3],
            [3, 0],
            [4, 5],
            [6, 7],
            [8, 9],
            [10, 11],
            [12, 13],
            [14, 15],
            [16, 17],
            [18, 19],
            [20, 21],
        ]
    );
    let mesh4 = new Mesh(
        [
            {x: -.1, y: -.1, z: 2},
            {x: .1, y: -.1, z: 2},
            {x: .1, y: .1, z: 2},
            {x: -.1, y: .1, z: 2},
            {x: -.1, y: -.1, z: 2.2},
            {x: .1, y: -.1, z: 2.2},
            {x: .1, y: .1, z: 2.2},
            {x: -.1, y: .1, z: 2.2}
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
    let scene = new Scene([mesh, mesh2, mesh3, mesh4]);
    let camera = new Camera();
    console.log(camera);
    scene.cameras.push(camera);
    window.addEventListener('keydown', (e) => {
        if(e.key == 'a') camera.translate(-.2, 0, 0);
        if(e.key == 'd') camera.translate(.2, 0, 0);
        if(e.key == 'ArrowUp') camera.translate(0, .2, 0);
        if(e.key == 'ArrowDown') camera.translate(0, -.2, 0);
        if(e.key == 'w') camera.translate(0, 0, .2);
        if(e.key == 's') camera.translate(0, 0, -.2);
        if(e.key == 'q') camera.rotate(-degToRad(10), 0, 0);
        if(e.key == 'e') camera.rotate(degToRad(10), 0, 0);
    })

    let oldtime = 0;
    let counter = 0
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
        //mesh.translate(Math.sin(time/10000), -Math.cos(time/10000));
        mesh.translate(.1*Math.cos(time/100), 0, 0);
        requestAnimationFrame(play);
    }

    play(0);
}