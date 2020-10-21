global.log= function(type,text){
    if(!savedData.debugging) return;
        switch(type){
            case 0:
                console.log("[\x1b[36mINDEXJS\x1b[0m]", text);
                break;
            case 1:
                console.log("[\x1b[35mWEBSITE\x1b[0m]", text);
                break;
            case 2:
                console.log("[\x1b[32mDISCORD\x1b[0m]", text);
                break;
            case 3:
                console.log("[\x1b[33mEVALCMD\x1b[0m]", text);
                break;
            default:
                console.log("[UNKNOWN]", type);
                break;
        }
}
//How often does it check for a new page.
global.updateTimer = (((1000 * 60) * 60) * 24);//Once a day.
global.savedData = require("./data_ personal.json");
const fs = require("fs");
const websiteHandler = new (require("./websiteHandler.js"))(savedData);
const discordHandler = new (require("./discordHandler.js"))(savedData);
let lastRan = 0;
global.timeout = undefined;
global.getTimer = function(full = false){
    let timeTill = updateTimer - (Date.now() - lastRan);
    let time = [];
    let second = 1000;
    let minute = second * 60;
    let hour = minute * 60;
    let day = hour * 24;
    let times = [day,hour,minute,second];
    for(let i =0;i<times.length;i++){
        time.push(0);
        while (timeTill > times[i]){
            time[i] ++;
            timeTill-=times[i];
        }
    }
    let amount = "";

    function addToAmount(txt,final){
        if(final && amount.length) amount+="and ";
        else txt +=", ";
        amount+=txt;
    }
    if(time[0] > 0) addToAmount(`${time[0]} Days`,false);
    if(time[1] > 0) addToAmount(`${time[1]} Hours`,false);
    if(time[2] > 0) addToAmount(`${time[2]} Minutes`,!((time[3] > 0 && time[0] === 0) || full));
    if((time[3] > 0 && time[0] === 0) || full) addToAmount(`${time[3]} Seconds`,!((timeTill > 0 && time[0] === 0 && time[1] === 0) || full));
    if((timeTill > 0 && time[0] === 0 && time[1] === 0) || full) addToAmount(`${timeTill} Milliseconds`,true);
    return amount;
}
global.checkForComic=function(repeat){
    log(0,"Checking for comic.");
    return new Promise(function(cb,rj){
        websiteHandler.getCurrentPageDate().then(function(date){
            if(savedData.latestComic !== date){
                websiteHandler.getCurrentPageImgLink().then(discordHandler.sendComic.bind(discordHandler));
                savedData.latestComic = date;
                fs.writeFile("data.json",JSON.stringify(savedData),function(){
                    log(0,'Updated [data.json] to contain comic\'s current date.');
                });
                cb(true);
            }
            else{
                log(0,'No new comic found.');
                cb(false);
            }
        }).catch(rj);
        if(repeat){
            lastRan = Date.now();
            timeout = setTimeout(checkForComic, updateTimer,true);
        }
    });
}
checkForComic(true);//Check for comic on boot.


log(0,"Index.js: Started");
