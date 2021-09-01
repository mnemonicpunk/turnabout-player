import { StoryParser } from './story_parser.js';
import { Stage } from './stage.js';
import { ANIMATIONS, BACKGROUNDS } from "./animations.js";


class AssetManager {
    constructor() {
        this.assets = [];
    }
}

class Game {
    constructor() {
        this.canvas = document.querySelector('#game_canvas');
        this.ctx = this.canvas.getContext('2d');
        this.story = null;
        this.assets = null;
        this.stage = new Stage();
        this.images = null;
        this.running = false;

        this.upper_screen = document.createElement('canvas');
        this.upper_screen.width = 256;
        this.upper_screen.height = 192;
        this.lower_screen = document.createElement('canvas');
        this.lower_screen.width = 256;
        this.lower_screen.height = 192;
        this.render_scale = 2;

        let self = this;
        let _draw = () => {
            self.draw();
            window.requestAnimationFrame(_draw);
        }
        let _tick = () => {
            self.tick();
            window.setTimeout(_tick, 1000/60);
        }

        _draw();
        _tick();

        window.addEventListener('resize', () => {
            self.resize();
        });
        this.resize();

        this.canvas.addEventListener('click', e => {
            self.running = true;
            self.stage.tap(e.clientX, e.clientY);
        });
    }
    init() {
        this.story = new StoryParser();
        this.assets = new AssetManager();
        this.images = null;

        let self = this;
        let files = [];
        for (let i in ANIMATIONS) {
            for (let j in ANIMATIONS[i]) {
                let sheet = ANIMATIONS[i][j].sheet;
                if (!(sheet in files)) {
                    files.push({
                        file: sheet,
                        transparent: true
                    });
                }
            }
        }
        for (let i in BACKGROUNDS) {
            files.push({
                file: BACKGROUNDS[i].background,
                transparent: false
            });
            if (BACKGROUNDS[i].foreground) {
                files.push({
                    file: BACKGROUNDS[i].foreground,
                    transparent: true
                });
                
            }
        
        }
        files.push({
            file: "ui.png",
            transparent: true
        });
        files.push({
            file: "font.png",
            transparent: true
        });
        let images = {};
        files.map(file_data => {
            return new Promise((resolve, reject) => {
                let file = file_data.file;
                let img = document.createElement('img');
                img.src = "./sprite/" + file;
                img.addEventListener('load', () => {
                    let canvas = document.createElement('canvas');
                    let ctx = canvas.getContext('2d');

                    canvas.width = img.width;
                    canvas.height = img.height;

                    ctx.drawImage(img, 0, 0);
                    
                    if (file_data.transparent) {
                        let img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        let data = img_data.data;    
                        let transparent = [data[0], data[1], data[2], data[3]];
                        if (file == "font.png") {
                            transparent = [0, 0, 0, 0];
                        }
    
                        for (let i=0; i<data.length; i+=4) {
                            let colors = [data[i], data[i+1], data[i+2], data[i+3]];
                            if ((colors[0] == transparent[0]) && (colors[1] == transparent[1]) && (colors[2] == transparent[2])) {
                                data[i+3] = 0;
                            }
                        }    
                        ctx.putImageData(img_data, 0, 0);
                    }
                    

                    images[file] = canvas;
                    resolve(canvas);
                });
                img.addEventListener('error', e => {
                    reject(e);
                });
            });
        }).reduce((prev, cur) => prev.then(cur)).then(() => {
            console.log("[Game] Images loaded.");
            self.images = images;
            console.dir(self);
        });
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.running) {
            try {
                this.stage.drawUpper(this.upper_screen.getContext('2d'), this.images);
                this.stage.drawLower(this.lower_screen.getContext('2d'), this.images);    
            } catch(e) {
                console.dir(e);
            }
            
            this.ctx.drawImage(this.upper_screen, 0, 0, 256, 192, 0, 0, 256*this.render_scale, 192*this.render_scale);
            this.ctx.drawImage(this.lower_screen, 0, 0, 256, 192, 0, 193*this.render_scale, 256*this.render_scale, 192*this.render_scale);    
        } else {
            this.ctx.fillStyle = "#fff";
            this.ctx.fillText("Click the screen to begin.", 10, 10);
        }
    }
    tick() {
        if ((this.story != null) && (this.running == true)) {
            if ((this.stage.line_finished) && (this.story.loaded)) {
                let l = this.story.next();
                if (l && l.type != "EOF") {
                    console.dir(l);
                }
                this.stage.setLine(l);
            }
            this.stage.tick();    
        }
    }
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
}

window.addEventListener('load', () => {
    let game = new Game();
    game.init();
});