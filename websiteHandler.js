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

    /**
     * Is ran everytime a comic gets posted to the discord.
     * @return {Promise<undefined>}
     */
    comicWasPosted(){
        return new Promise((cb,rj) => {
            this.data.previouslyPostedLink = this.getDownloadLocation();
            this.incrementComicValue();//IMPORTANT
            savedData.websiteHandlerData = this.data;
            this.getDownloadLocation();
            fs.writeFile("data.json", JSON.stringify(savedData, null, 4), function(e){
                if(e) rj(e);
                log(1, "Updated [data.json] to contain updated websiteHandlerData.");
                cb();
            });
        })
    }

    /**
     * Gets ran EVERY time a comic gets posted. Update whatever increment you use in websiteHandler.getDownloadLocation()
     */
    deincrementComicValue(){
        this.data.increment--;
    }
    incrementComicValue(){
        this.data.increment++;
    }
    /**
     * Gets the download location.
     * @return {string}
     */
    getDownloadLocation(){
        this.data.link = `http://www.thedreamlandchronicles.com/comic/the-dreamland-chronicles-page-${this.data.increment}/`;
        return this.data.link;
    }

    /**
     * Gets the pure HTML from the comic's page.
     * @return {Promise<string>}
     */
    getCurrentPageHTML(LINK = false){
        return new Promise((cb, rj) => {
            log(1, "Checking HTML");
            log(4, (new Date()).toString());
            if(!LINK) LINK = this.data.link;
            console.log(LINK)
            fetch(LINK)
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
            this.getCurrentPageHTML().then((HTML) => {
                HTML = HTML.replace(/\s+/g, "");
                HTML = HTML.replace(/\t+/g, "");
                HTML = HTML.substring(HTML.indexOf("<divclass=\"post-text\">"), HTML.length);
                HTML = HTML.substring(0, HTML.indexOf("</span><divclass=\"comic-post-info\">"));
                HTML = HTML.substring(HTML.indexOf("<spanclass=\"posted-on\">on&nbsp;</span><spanclass=\"post-date\">") + 61, HTML.length);
                HTML = HTML.replace("</span><spanclass=\"posted-at\">at&nbsp;</span><spanclass=\"post-time\">", ",");
                log(1, "Successfully retrieved comic's differential: " + HTML);
                cb(HTML);
            }).catch(rj);
        });
    }

    /**
     * Get the main comic from the HTML
     * @return {Promise<string>}
     */
    getCurrentPageImgLink(LINK=false){
        return new Promise((cb, rj) => {
            this.getCurrentPageHTML(LINK).then((HTML) => {
                HTML = HTML.replace(/\s+/g, "");
                HTML = HTML.replace(/\t+/g, "");
                if(HTML.indexOf("<divid=\"comic\">") === -1) {
                    cb(false);
                    return;
                }
                HTML = HTML.substring(0, HTML.indexOf("></a></div>"));
                HTML = HTML.substring(HTML.indexOf("<imgsrc=\"") + 9, HTML.length);
                HTML = HTML.substring(0, HTML.indexOf(".jpg") + 4);
                log(1, "Successfully retrieved comic's image: " + HTML);
                cb(HTML);
            }).catch(rj);
        });
    }

    /**
     * Checks and then gets any new comic pages.
     * Returns FALSE is no new comic is available
     * otherwise returns an object containing 2 arrays of all the new comics as well as anything extra.
     * @return {Promise<boolean|object>}
     */
    getComicPages(){
        return new Promise((cb,rj)=>{
            let returnData = {
                images:[],
                links:[],
                extra:savedData.websiteHandlerData.previouslyPostedLink
            }
            let lastCheckedPage = this.data.previouslyPostedLink;
            let getPage = ()=>{
                return new Promise((cb,rj)=>{
                    this.getDownloadLocation();
                    this.getCurrentPageDifferential().then((result)=>{
                        if(lastCheckedPage !== result){
                            lastCheckedPage = result;
                            this.getCurrentPageImgLink().then((result) => {
                                if(typeof result === "string"){
                                    returnData.images.push(result);
                                    returnData.links.push(this.data.link);
                                    cb(true);
                                }
                                else cb(false);

                            }).catch(rj);
                        }
                        else cb(false);
                    }).catch(rj);
                })
            }
            let repeater = ()=>{
                getPage().then((result)=>{
                    if(!result && returnData.images.length === 0){
                        this.getDownloadLocation();
                        cb(false);
                    }
                    else if(!result) {
                        this.deincrementComicValue();
                        this.getDownloadLocation();
                        cb(returnData);
                    }
                    else {
                        this.incrementComicValue();
                        repeater();
                    }
                }).catch(rj);
            }
            repeater();


        })
    }
}

module.exports = websiteHandler;
