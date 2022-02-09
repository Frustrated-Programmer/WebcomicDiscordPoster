require("./loggingHandler.js");
//How often does it check for a new page.
global.updateTimer = (((1000 * 60) * 60));//Every hour.
global.savedData = require("./data - used.json");
log(4, (new Date()).toString());

const fs = require("fs");
let botDownAlready = false;
global.isBotDown = null;
global.botDown = function(){
    try{
        if(botDownAlready) return;
        isBotDown = true;
        log(0, "Checking if client can reconnect in 30 minutes.");
        log(4, (new Date()).toString());
        botDownAlready = true;
        setTimeout(function(){
            botDownAlready = false;
            log(0, "Checking if client can reconnect.");
            log(4, (new Date()).toString());
            discordHandler.reboot();
        }, (60000 * 30));
    }
    catch(e){
        errorHandler.onError(e).then(function(minutes){
            setTimeout(botDown, minutes * 60000);
        }).catch(function(e){
            console.log("Something really bad happened, the error handler failed.");
            console.error(e);
            process.exit(0);
        });
    }
};
global.websiteHandler = new (require("./websiteHandler.js"))(savedData);
global.discordHandler = new (require("./discordHandler.js"))(savedData);
global.emailHandler = new (require("./emailHandler.js"))(savedData);
global.errorHandler = new (require("./errorHandler.js"))(savedData);
global.errorHandlerCrashed = function(error){
    console.log("Something really bad happened, the error handler failed.");
    console.error(error);
    process.exit(1);
};
let lastRan = 0;
global.timeout = undefined;
global.getTimer = function(full = false){
    let timeTill = updateTimer - (Date.now() - lastRan);
    let time = [];
    let second = 1000;
    let minute = second * 60;
    let hour = minute * 60;
    let day = hour * 24;
    let times = [day, hour, minute, second];
    for(let i = 0; i < times.length; i++){
        time.push(0);
        while(timeTill > times[i]){
            time[i]++;
            timeTill -= times[i];
        }
    }
    let amount = "";

    function addToAmount(txt, final){
        if(final && amount.length) amount += "and ";
        else txt += ", ";
        amount += txt;
    }

    if(time[0] > 0) addToAmount(`${time[0]} Days`, false);
    if(time[1] > 0) addToAmount(`${time[1]} Hours`, false);
    if(time[2] > 0) addToAmount(`${time[2]} Minutes`, !((time[3] > 0 && time[0] === 0) || full));
    if((time[3] > 0 && time[0] === 0) || full) addToAmount(`${time[3]} Seconds`, !((timeTill > 0 && time[0] === 0 && time[1] === 0) || full));
    if((timeTill > 0 && time[0] === 0 && time[1] === 0) || full) addToAmount(`${timeTill} Milliseconds`, true);
    return amount;
};
global.checkForComic = function(repeat=false,where){
    log(0,where)
    log(0, "Checking for comic.");
    return new Promise(function(cb, rj){
        try{
            websiteHandler.getCurrentPageDifferential().then(function(date){
                if(savedData.latestComic !== date){
                    websiteHandler.getCurrentPageImgLink().then((result)=>{
                        discordHandler.sendComic.bind(discordHandler)({
                            imageLink: result,
                            websiteLink: websiteHandler.getDownloadLocation(),
                           // extra:savedData.websiteHandlerData.previouslyPostedLink,
                        }).then(()=>{
                            websiteHandler.comicWasPosted().then(()=>{
                            savedData.latestComic = date;
                            fs.writeFile("data.json", JSON.stringify(savedData, null, 4), function(e){
                                if(e) rj(e);
                                    log(0, "Updated [data.json] to contain comic's current date.");
                                    cb(true);
                                });
                            }).catch(rj);
                        }).catch(rj);
                    }).catch(rj);
                }
                else{
                    log(0, "No new comic found.");
                    cb(false);
                }
            }).catch(rj);
            if(repeat){
                clearTimeout(timeout);
                lastRan = Date.now();
                timeout = setTimeout(checkForComic, updateTimer, [true,"CheckForComik's Repeat"]);
            }
        }
        catch(e){
            errorHandler.onError(e).then(function(minutes){
                setTimeout(checkForComic, minutes * 60000, [repeat,"CheckForComik's Error"]);
            }).catch(errorHandlerCrashed);
        }
    });

};


log(0, "Index.js: Started");
checkForComic(true,"IndexJS,1").then(function(result){
    log(0, "Check for comic success: " + result);
}).catch(function(e){
    errorHandler.onError(e).then(function(minutes){
        setTimeout(checkForComic, minutes * 60000, [true,"IndexJS,2"]);
    }).catch(errorHandlerCrashed);
});//Check for comic on boot.

