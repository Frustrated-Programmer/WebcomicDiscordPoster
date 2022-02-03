require("./loggingHandler.js");
//How often does it check for a new page.
global.updateTimer = (((1000 * 60) * 60));//Every hour.
global.savedData = require("./data.json");
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
global.checkForComic = function(repeat){
    clearTimeout(timeout);
    try{
        log(0, "Checking for comic.");
        return new Promise(function(cb, rj){
            websiteHandler.getCurrentPageDate().then(function(date){
                if(savedData.latestComic !== date){
                    websiteHandler.getCurrentPageImgLink().then(()=>{
                        discordHandler.sendComic.bind(discordHandler).then(()=>{
                            savedData.latestComic = date;
                            fs.writeFile("data.json", JSON.stringify(savedData, null, 4), function(){
                                log(0, "Updated [data.json] to contain comic's current date.");
                            });
                            cb(true);
                        }).catch(rj);
                    });
                }
                else{
                    log(0, "No new comic found.");
                    cb(false);
                }
            }).then(function(){
                log(0,"Checking Discord Client.");
                discordHandler.check().then(function(rebooted){
                    if(rebooted) log(0,"Client was offline, rebooted.");
                    else log(0,"Client is still online.")
                }).catch(rj);
            }).catch(rj);
            if(repeat){
                lastRan = Date.now();
                timeout = setTimeout(checkForComic, updateTimer, true);
            }
        });
    }
    catch(e){
        errorHandler.onError(e).then(function(minutes){
            setTimeout(checkForComic, minutes * 60000, repeat);
        }).catch(errorHandlerCrashed);
    }
};
checkForComic(true).then(function(result){
    log(0, "Check for comic success: " + result);
}).catch(function(e){
    errorHandler.onError(e).then(function(minutes){
        setTimeout(checkForComic, minutes * 60000, true);
    }).catch(errorHandlerCrashed);
});//Check for comic on boot.

log(0, "Index.js: Started");
