import { ANIMATIONS, BACKGROUNDS } from "./animations.js";

const character_map = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz!?.";
const character_width = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 9, 10, 9, 9, 8, 11, 9, 5, 8, 10, 9, 11, 9, 12, 9, 12, 9, 9, 9, 9, 9, 14, 8, 9, 9, 5, 8, 8, 8, 8, 8, 6, 8, 8, 3, 4, 8, 3, 11, 8, 9, 8, 8, 6, 8, 6, 8, 9, 11, 9, 9, 8, 3, 9, 4];

export class Stage {
    constructor() {
        this.line = null;
        this.line_finished = true;
        this.animation = null;
        this.background = null;
        this.bgm = null;
        this.sfx = {};

        this.animation_timer = 0;
        this.animation_max = 10;

        this.text_speed = 3;
        this.text_timer = 0;

        this.message_box = {
            text: "",
            current: 0,
            active: false
        }
    }
    setLine(line) {
        this.line = line;
        this.line_finished = false;
    }
    tick() {
        if (this.line_finished) {
            return;
        }
        if (this.line != null) {
            switch (this.line.type) {
                case "log":
                    console.log("[LOG] " + this.line.text);
                    this.line_finished = true;
                    break;
                case "animation":
                    console.log("[ANIMATION] " + this.line.animation);
                    if (this.line.animation != "none") {
                        this.animation = ANIMATIONS[this.line.animation];
                    } else {
                        this.animation = [];
                    }
                    
                    this.animation_frame = 0;
                    this.animation_timer = 0;
                    this.line_finished = true;
                    break;
                case "say":
                    if (!this.message_box.active) {
                        this.message_box = {
                            text: this.line.text,
                            current: 0,
                            active: true
                        }    
                    }
                    break;
                case "bg":
                    this.background = this.line.bg;
                    if (this.line.bg == "none") {
                        this.background = null;
                    }
                    this.line_finished = true;
                    break;
                case "bgm":
                    this.playBGM(this.line.bgm);
                    this.line_finished = true;
                    break;                    
                case "EOF":
                    this.line_finished = true;
                    break;
            }
        }
        this.animation_timer++;
        if (this.animation_timer >= this.animation_max) {
            this.animation_frame++;
            this.animation_timer = 0;

            if (this.animation != null) {
                if (this.animation_frame >= this.animation.length) {
                    this.animation_frame = 0;
                }    
            } else {
                this.animation_frame = 0;
            }
        }

        if (this.message_box.active) {
            this.text_timer++;
            if (this.text_timer >= this.text_speed) {
                this.text_timer = 0;
                this.message_box.current++;
                this.stopSFX("sfx-blipmale.wav");
                this.playSFX("sfx-blipmale.wav");
            }
            if (this.message_box.current >= this.message_box.text.length) {
                this.message_box.current = this.message_box.text.length;
                this.animation_frame = 0;
                this.stopSFX("sfx-blipmale.wav");
            }    
        }
    }
    drawUpper(ctx, sprites) {
        ctx.clearRect(0, 0, 256, 192);

        let bg = null;
        if ((this.background != null) && (this.background != "none")) {
            bg = BACKGROUNDS[this.background];
            ctx.drawImage(sprites[bg.background], 0, 0);
        }

        if (sprites && this.animation) {
            let anim = this.animation[this.animation_frame];
            if (anim != undefined) {
                let img = sprites[anim.sheet];
                let src = {
                    x: anim.x,
                    y: anim.y,
                    w: anim.w,
                    h: anim.h
                }
                let dst = {
                    x: anim.dest_x,
                    y: anim.dest_y,
                    w: anim.w,
                    h: anim.h
                }
                ctx.drawImage(img, src.x, src.y, src.w, src.h, dst.x, dst.y, dst.w, dst.h);      
            }
        }

        if ((this.background != null) && (this.background != "none")) {
            bg = BACKGROUNDS[this.background];
            if (bg.foreground) {
                //ctx.drawImage(sprites[bg.foreground], bg.x, bg.y);
                ctx.drawImage(sprites[bg.foreground], bg.fsx, bg.fsy, bg.fsw, bg.fsh, bg.x, bg.y, bg.fsw, bg.fsh);
            }
            
        }

        if (this.message_box.active) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(sprites["ui.png"], 505, 1899, 241, 47, 5, 140, 241, 47);
            ctx.globalAlpha = 1;

            let text = this.message_box.text.substr(0, this.message_box.current);
            this.drawTextBox(ctx, sprites, text, 8, 148);
            //this.drawText(ctx, sprites, text, 8, 148);
        }
    }
    drawLower(ctx, sprites) {
        ctx.clearRect(0, 0, 256, 192);

        ctx.fillStyle = "#444";
        ctx.fillRect(0, 0, 256, 192);

        // 22 17 223 111
        if (sprites != null) {
            ctx.drawImage(sprites["ui.png"], 22, 17, 223, 111, 15, 40, 223, 111);
        }
        
    }
    drawTextBox(ctx, sprites, text, x, y) {
        let parts = text.split(' ');
        let line1 = "";
        let line2 = "";
        let flip = false;

        while(parts.length > 0) {
            let next_part = parts.shift();
            let test_line = line1;
            if (test_line != "") {
                test_line += " ";
            }
            let test_width = this.stringWidth(test_line + next_part);
            if (test_width >= 236) {
                flip = true;
            }
            
            if (flip) {
                if (line2 != "") {
                    line2 += " ";
                }
                line2 += next_part;
            } else {
                line1 = test_line + next_part;
            }
        }

        this.drawText(ctx, sprites, line1, x, y);
        this.drawText(ctx, sprites, line2, x, y+20);
    }
    drawText(ctx, sprites, text, x, y) {
        let font = sprites["font.png"];
        let chars_per_line = 8;
        let tile_size = 17;

        let x_pos = 0;

        for (let i = 0; i<text.length; i++) {
            let c = text[i];
            let c_num = -1;

            let sx = 0;
            let sy = 0;

            if (character_map.includes(c)) {
                c_num = character_map.indexOf(c);

                sx = c_num % chars_per_line;
                sy = Math.floor(c_num / chars_per_line);

                //console.dir([sx, sy, tile_size, c, c_num]);

                ctx.drawImage(font, (sx * tile_size)+2, (sy * tile_size)+2, tile_size-2, tile_size-2, x + x_pos, y, tile_size-2, tile_size-2);
                x_pos += character_width[c_num];
            }
        }
    }
    stringWidth(text) {
        let width = 0;
        for (let i=0; i<text.length; i++) {
            if (character_map.includes(text[i])) {
                let c_num = character_map.indexOf(text[i]);
                width += character_width[c_num];
            }
        }
        return width;
    }
    tap(x, y) {
        if (this.message_box.active) {
            
            if (this.message_box.current >= this.message_box.text.length) {
                console.log("Tap!");
                this.line_finished = true;
                this.message_box.active = false;
            }
        }    
    }
    playBGM(file) {
        if (this.bgm != null) {
            this.bgm.pause();
        }
        if (file != "none") {
            this.bgm = document.createElement('audio');
            this.bgm.src = "./bgm/" + file + ".mp3";
            this.bgm.play();    
        }
    }
    playSFX(file) {
        if (!(file in this.sfx)) {
            let sfx = document.createElement('audio');
            sfx.src = "./sfx/" + file;
            this.sfx[file] = sfx;
        }
        this.sfx[file].play().catch(e => {});
    }
    stopSFX(file) {
        if ((file in this.sfx)) {
            this.sfx[file].pause();
            this.sfx[file].currentTime = 0;
        }
    }
}