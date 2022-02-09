/**
 *  The WebsiteHandler is to download the webpage from it's target,
 *  and extract the date & time and the image that goes with it.
 *  This can break easily due to the webpage may get an update.
 *  But without an API this is the best I can do.
 */
const fetch = require("node-fetch");
const fs = require("fs");

class websiteHandler{
    constructor(savedData){
        log(1, "WebsiteHandler: READY.");
        this.data = savedData && savedData.websiteHandlerData || {
            link: "http://www.thedreamlandchronicles.com/", //The bot is currently setup for this domain.
            increment: 0
        };
        this.getDownloadLocation();
    }
    comicWasPosted(){
        return new Promise((cb,rj) => {
            this.data.previouslyPostedLink = this.getDownloadLocation();
            this.data.increment++;
            savedData.websiteHandlerData = this.data;
            fs.writeFile("data.json", JSON.stringify(savedData, null, 4), function(e){
                if(e) rj(e);
                log(1, "Updated [data.json] to contain updated websiteHandlerData.");
                cb();
            });
        })
    }
    getDownloadLocation(){
        this.data.link = "http://www.thedreamlandchronicles.com/";
        return this.data.link;
    }
    /**
     * Gets the pure HTML from the comic's page.
     * @return {Promise<string>}
     */
    getCurrentPageHTML(){
        return new Promise((cb, rj) => {
            this.getDownloadLocation();
            log(1, "Checking HTML");
            log(4, (new Date()).toString());
            fetch(this.data.link)
                .then((result) => {
                    if(result){
                        log(1, "Successfully retrieved HTML for: " + this.data.link);
                        result.text().then(cb).catch(rj);
                    }
                    else{
                        rj("Fetch returned result as: " + result);
                    }
                }).catch(rj);
        });
    }

    /**
     * Gets the date & time embedded in the HTML.
     * @return {Promise<string>}
     */
    getCurrentPageDifferential(){
        return new Promise((cb, rj) => {
            this.getDownloadLocation();
            this.getCurrentPageHTML().then((HTML) => {
                HTML = HTML.replace(/\s+/g, "");
                HTML = HTML.replace(/\t+/g, "");
                HTML = HTML.substring(HTML.indexOf("<divclass=\"post-text\">"), HTML.length);
                HTML = HTML.substring(0, HTML.indexOf("</span><divclass=\"comic-post-info\">"));
                HTML = HTML.substring(HTML.indexOf("<spanclass=\"posted-on\">on&nbsp;</span><spanclass=\"post-date\">") + 61, HTML.length);
                HTML = HTML.replace("</span><spanclass=\"posted-at\">at&nbsp;</span><spanclass=\"post-time\">", ",");
                log(1, "Successfully retrieved comic's date: " + HTML);
                cb(HTML);
            }).catch(rj);
        });
    }

    /**
     * Get the main comic from the HTML
     * @return {Promise<string>}
     */
    getCurrentPageImgLink(){
        return new Promise((cb, rj) => {
            this.getDownloadLocation();
            this.getCurrentPageHTML().then((HTML) => {
                HTML = HTML.replace(/\s+/g, "");
                HTML = HTML.replace(/\t+/g, "");
                HTML = HTML.substring(HTML.indexOf("<divid=\"comic\">"), HTML.length);
                HTML = HTML.substring(0, HTML.indexOf("></a></div>"));
                HTML = HTML.substring(HTML.indexOf("<imgsrc=\"") + 9, HTML.length);
                HTML = HTML.substring(0, HTML.indexOf(".jpg") + 4);
                log(1, "Successfully retrieved comic's image: " + HTML);
                cb(HTML);
            }).catch(rj);
        });
    }
}

module.exports = websiteHandler;
