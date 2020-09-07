const fetch = require("node-fetch");
class websiteHandler{
    constructor(options){
        options = options || {};
        this.debugging = options.debugging || false;
        log(1,'WebsiteHandler: Started.');
    }
    getCurrentPageHTML(){
        return new Promise((cb, rj) =>{
            fetch("http://www.thedreamlandchronicles.com/")
                .then((result) => {
                    log(1,'Successfully retrieved HTML for: http://www.thedreamlandchronicles.com/');
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
                log(1,'Successfully retrieved comic\'s date: '+HTML);
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
                log(1,'Successfully retrieved comic\'s image: '+HTML);
                cb(HTML);
            }).catch(rj);
        });
    }
}
module.exports = websiteHandler;
