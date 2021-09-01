export class StoryParser {
    constructor() {
        this.text = "";
        this.lines = [];
        this.labels = [];
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
        let labels = [];
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
                case "JUMP":
                    parsed.push({
                        type: "jump",
                        label: parts[1]
                    });
                    break;                                                                                            
            }
            if (parts[0][0] == ">") {
                console.log("Registering label '" + parts[0] + "'");
                labels.push({
                    name: parts[0],
                    line_num: -1
                });
                parsed.push({
                    type: "label",
                    name: parts[0]
                });
            }
        }

        for (let l in labels) {
            for (let line in parsed) {
                if ((parsed[line].type == "label") && (parsed[line].name == labels[l].name)) {
                    labels[l].line_num = line;
                }
            }
        }

        this.lines = parsed;
        this.labels = labels;
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

        let line = this.lines[this.current_line];
        let line_resolved = false;

        {
            line_resolved = true;
            if (line.type == "jump") {
                console.log("Jump command found: Jumping to " + line.label + "...");
                this.current_line = this.resolveLabel(line.label);
                line = this.lines[this.current_line];
                //line_resolved = false;
            }
        } while(!line_resolved);

        return line;
    }
    resolveLabel(name) {
        for (let l in this.labels) {
            let label = this.labels[l];
            if (label.name == name) {
                console.log("Label " + name + " resolved to line " + label.line_num);
                return label.line_num;
            }
        }
        return -1;
    }
}