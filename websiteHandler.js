/**
 *  The WebsiteHandler is to download the webpage from it's target,
 *  and extract the date & time and the image that goes with it.
 *  This can break easily due to the webpage may get an update.
 *  But without an API this is the best I can do.
 */
const fetch = require("node-fetch");

class websiteHandler{
    constructor(){
        this.downloadLocation = "http://www.thedreamlandchronicles.com/";//The bot is currently setup for this domain.
        log(1, "WebsiteHandler: READY.");
    }

    /**
     * Gets the pure HTML from the comic's page.
     * @return {Promise<string>}
     */
    getCurrentPageHTML(){
        return new Promise((cb, rj) => {
            log(1, "Checking HTML");
            log(4, (new Date()).toString());
            fetch(this.downloadLocation)
                .then((result) => {
                    if(result){
                        log(1, "Successfully retrieved HTML for: " + this.downloadLocation);
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
    getCurrentPageDate(){
        return new Promise((cb, rj) => {
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
