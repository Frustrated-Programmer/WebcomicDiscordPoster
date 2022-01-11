const useConsoleColors = false;
const logDateAndTime = false;
const showEntireError = false;

/***************-****************/
const logTypes = {
    0: "INDEXJS",
    1: "WEBSITE",
    2: "DISCORD",
    3: "EVALCMD",
    4: "DAT&TIM",
    5: "ERROR!!",
    6: "EMAIL..",
    "undefined": "UNKNOWN",
    "null": "UNKNOWN",
    "nan": "UNKNOWN"
};
const consoleColors = {
    0: "\x1b[36m",
    1: "\x1b[35m",
    2: "\x1b[32m",
    3: "\x1b[33m",
    4: "\x1b[34m",
    5: "\x1b[31m",
    6: "\x1b[33m",
    "undefined": "",
    "null": "",
    "nan": ""
};


global.log = function(type, text){
    if(!savedData.debugging && type < 100) return;//if debug mode is off, then only log if type is 100 or higher
    if(type >= 100) type = type % 10;//Add a 100 to a type to override .debugging requirement.
    if(!logDateAndTime && type === 4) return;
    if(!showEntireError && type === 5){
        if(text["code"]) text = text["code"];
        if(text["message"]) text = text["message"];
        if(text["errno"]) text = "ErrorNum: "+text["errno"];
    }
    console.log(`${useConsoleColors ? `\x1b[0m[${consoleColors[type]}` : "["}${logTypes[type]}${useConsoleColors ? "\x1b[0m" : ""}]: `,text);
};

