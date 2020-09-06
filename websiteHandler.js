const fetch = require("node-fetch");
class websiteHandler{
    constructor(options){
        options = options || {};
        this.debugging = options.debugging || false;
        this.log('WebsiteHandler: Started.');
    }
    log(text){
        if(this.debugging) console.log("[\x1b[35mWEBSITE\x1b[0m]",text);
    }
    getCurrentPageHTML(){
        return new Promise((cb, rj) =>{
            fetch("http://www.thedreamlandchronicles.com/")
                .then((result) => {
                    this.log('Successfully retrieved HTML for: http://www.thedreamlandchronicles.com/');
                    result.text().then(cb).catch(rj);
                }).catch(rj);
        });
    }
    getCurrentPageDate(){
        return new Promise((cb, rj) =>{
            this.getCurrentPageHTML().then((HTML) => {
                HTML = HTML.replace(/\s+/g, "");
                HTML = HTML.replace(/\t+/g, "");
                HTML = HTML.substring(HTML.indexOf("<divclass=\"post-text\">"),HTML.length);
                HTML = HTML.substring(0,HTML.indexOf("</span><divclass=\"comic-post-info\"></div></div>"));
                HTML = HTML.substring(HTML.indexOf("<spanclass=\"posted-on\">on&nbsp;</span><spanclass=\"post-date\">")+61,HTML.length);
                HTML = HTML.replace("</span><spanclass=\"posted-at\">at&nbsp;</span><spanclass=\"post-time\">",",");
                this.log('Successfully retrieved comic\'s date: '+HTML);
                cb(HTML);
            });
        });
    }
    getCurrentPageImgLink(){
        return new Promise((cb, rj) =>{
            this.getCurrentPageHTML().then((HTML) =>{
                    HTML = HTML.replace(/\s+/g, "");
                    HTML = HTML.replace(/\t+/g, "");
                    HTML = HTML.substring(HTML.indexOf("<divid=\"comic\"><imgsrc=\"") + 24, HTML.length);
                    HTML = HTML.substring(0, HTML.indexOf("></div>"));
                    HTML = HTML.substring(0, HTML.indexOf(".jpg") + 4);
                    this.log('Successfully retrieved comic\'s image: '+HTML);
                    cb(HTML);
                }).catch(rj);
        });
    }
}
module.exports = websiteHandler;
