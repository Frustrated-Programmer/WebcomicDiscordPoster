require("./loggingHandler.js");
//How often does it check for a new page.
global.savedData = require("./data.json");
global.updateTimer = savedData.updateTimer || 86400000;
log(4, (new Date()).toString());

let botDownAlready = false;
global.convertTimeToText = function(dateTime,full){
    let time = [];
    let times = [86400000, 3600000, 60000, 1000];
    for(let i = 0; i < times.length; i++){
        time.push(0);
        while(dateTime > times[i]){
            time[i]++;
            dateTime -= times[i];
        }
    }
    time.push(dateTime);
    let amount = "";

    function addToAmount(txt, final){
        if(final && amount.length) amount += "and ";
        else txt += ", ";
        amount += txt;
    }

    if(time[0] > 0) addToAmount(`${time[0]} Days`, false);
    if(time[1] > 0) addToAmount(`${time[1]} Hours`, false);
    if(time[2] > 0) addToAmount(`${time[2]} Minutes`, !((time[3] > 0 && time[0] === 0) || full));
    if((time[3] > 0 && time[0] === 0) || full) addToAmount(`${time[3]} Seconds`, !((time[4] > 0 && time[0] === 0 && time[1] === 0) || full));
    if((time[4] > 0 && time[0] === 0 && time[1] === 0) || full) addToAmount(`${time[4]} Milliseconds`, true);
    return amount;
}
global.isBotDown = null;
global.botDown = function(){
    try{
        if(botDownAlready) return;
        global.isBotDown = true;
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
    return convertTimeToText(updateTimer - (Date.now() - lastRan),full)
};
global.checkForComic = function(repeat=false){
    log(0, "Checking for comic.");
    return new Promise(function(cb, rj){
        try{
            websiteHandler.getComicPages().then(function(result){
                if(result === false){
                    log(0, "No new comic found.");
                    cb(false);
                }
                else{
                    discordHandler.sendComic.bind(discordHandler)(result).then(()=>{
                        websiteHandler.comicWasPosted().then(()=>{
                            cb(true);
                        }).catch(rj);
                    }).catch(rj);
                }
            }).catch(rj);
            if(repeat){
                clearTimeout(timeout);
                lastRan = Date.now();
                global.timeout = setTimeout(checkForComic, updateTimer, repeat);
            }
        }
        catch(e){
            errorHandler.onError(e).then(function(minutes){
                setTimeout(checkForComic, minutes * 60000, repeat);
            }).catch(errorHandlerCrashed);
        }
    });

};


log(0, "Index.js: Started");
checkForComic(true).then(function(result){
    log(0, "Check for comic success: " + result);
}).catch(function(e){
    errorHandler.onError(e).then(function(minutes){
        setTimeout(checkForComic, minutes * 60000, true);
    }).catch(errorHandlerCrashed);
});//Check for comic on boot.

