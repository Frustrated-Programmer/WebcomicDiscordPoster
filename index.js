const log= function(type,text){
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
                console.log("[\x1b[33mPINGER.\x1b[0m]", text);
                break;
            default:
                console.log("[UNKNOWN]", type);
                break;
        }
}
global.log = log;
let savedData = require("./savedData.json");
const websiteHandler = new (require("./websiteHandler.js"))(savedData);
const discordHandler = new (require("./discordHandler.js"))(savedData,checkForComic,getTimer);
const fs = require("fs");
//How often does it check for a new page.
const updateTimer = ((((1000 * 60) * 60) * 24) * 7);//Once a week.
let lastRan = 0;
function getTimer(){
    let timeTill = updateTimer - (lastRan - Date.now());
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
        if(final && amount.length) txt+="and ";
        amount+=txt;
        if(!final) txt+=", ";
    }
    if(time[0] > 0) addToAmount(`${time[0]} Days`);
    if(time[1] > 0) addToAmount(`${time[1]} Hours`);
    if(time[2] > 0) addToAmount(`${time[2]} Minutes`,!(time[0] === 0));
    if(time[3] > 0 && time[0] === 0) addToAmount(`${time[3]} Seconds`,!(time[0] === 0 && time[1] === 0));
    if(timeTill > 0 && time[0] === 0 && time[1] === 0) addToAmount(`${timeTill} Milliseconds`);
    return amount;
}
function checkForComic(repeat){
    log(0,"Checking for comic.");
    return new Promise(function(cb,rj){
        websiteHandler.getCurrentPageDate().then(function(date){
            if(savedData.latestComic !== date){
                websiteHandler.getCurrentPageImgLink().then(discordHandler.sendComic.bind(discordHandler));
                savedData.latestComic = date;
                fs.writeFile("savedData.json",JSON.stringify(savedData),function(){
                    log(0,'Updated [savedData.json] to contain comic\'s current date.');
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
            setTimeout(checkForComic, updateTimer,true);
        }
    });
}
checkForComic(true);//Check for comic on boot.


log(0,"Index.js: Started");
