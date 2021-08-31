export class StoryParser {
    constructor() {
        this.text = "";
        this.lines = [];
        this.current_line = 0;
        this.loaded = false;

        fetch('./story.txt').then(result => result.text()).then(story => {
            this.parseStory(story);
            this.loaded = true;
        });
    }
    parseStory(story_text) {
        this.text = story_text;

        let sep = "\n";
        if (this.text.includes("\r\n")) {
            sep = "\r\n";
        }

        let lines = this.text.split(sep);

        let parsed = [];
        for (let l in lines) {
            let parts = lines[l].split(' ');
            switch(parts[0]) {
                case "LOG":
                    //console.log("[LOG] " + lines[l].substr(4));
                    parsed.push({
                        type: "log",
                        text: lines[l].substr(4)
                    });
                    break;
                case "SAY":
                    parsed.push({
                        type: "say",
                        text: lines[l].substr(4)
                    });
                    break;
                case "BG":
                    parsed.push({
                        type: "bg",
                        bg: lines[l].substr(3)
                    });
                    break;                    
                case "ANIMATION":
                    parsed.push({
                        type: "animation",
                        animation: lines[l].substr(10)
                    });
                    break;
                case "ACT":
                    parsed.push({
                        type: "act",
                        animation: lines[l].substr(4)
                    });
                    break;                    
                case "BGM":
                    parsed.push({
                        type: "bgm",
                        bgm: lines[l].substr(4)
                    });
                    break;
                case "SFX":
                    parsed.push({
                        type: "sfx",
                        sfx: lines[l].substr(4)
                    });
                    break;                      
                case "FLASH":
                    parsed.push({
                        type: "flash",
                        progress: 0
                    });
                    break;                                                                          
            }
        }

        this.lines = parsed;
        this.current_line = -1;

        console.dir(this.lines);
    }
    next() {
        this.current_line++;
        return this.get();
    }
    get() {
        if (this.current_line > this.lines.length) {
            this.current_line = this.lines.length;
            return {
                type: "EOF"
            }
        }
        return this.lines[this.current_line];
    }
}