/**
 * The DiscordHandler is the part that takes care of the user side of things.
 * Here we make sure the client is online as much as possible,
 * Reboot itself when the client goes down,
 * and of course when prompted send the Comic Strip to the desired channel.
 */
const discord = require("discord.js");
let aComicPostedMsg = ["Hey @everyone, a new Dreamland Comic has been posted:", "@everyone, please turn your attention to the new Dreamland Comic:", "Attention @everyone, a new Dreamland Comic:"];
let multipleComicsPostedMsg = ["Hey @everyone, {num} new Dreamland Comics has been posted:", "@everyone, please turn your attention to the {num} new Dreamland Comics:", "Attention @everyone, {num} new Dreamland Comics:"];

/**
 * Get a formatted version of Date & Time.
 * @param {Date} time
 * @return {string}
 */
function getTime(time){
    let minutes = time.getMinutes();
    let minutesText = `00`;
    minutesText = minutesText.substring(`${minutes}`.length);
    return `${time.getHours() > 12 ? time.getHours() - 12 : time.getHours()}:${minutesText}${minutes} ${time.getHours() > 12 ? `PM` : `AM`}`;
}

//Used in case the eval command uses a console.log .error or .warn The .dir is left due to me not wanting to try to reproduce it.
let console = {
    log: function(item){
        log(103, item);
    },
    warn: function(item){
        log(103, "[WARN] " + item);
    },
    error: function(item, item2){
        if(item !== undefined) log(105, item);
        else log(105, item2);
    }
};

class command{
    constructor(permissions, func, names){
        if(typeof names === "string") names = [names];
        this.name = names.splice(0, 1);
        this.alias = names;
        this.permission = permissions;
        switch(this.permission){
            default:
                this.noPerms = "Something went wrong. Couldn't run the command.";
                break;
            case 1:
                this.noPerms = "I'm sorry, but only Admins of the bot can use this command";
                break;
            case 2:
                this.noPerms = "I'm sorry, but only Owners of the bot can use this command";
                break;
        }
        this._func = func;
    }

    hasPermission(user){
        switch(this.permission){
            case 0://EVERYONE
                return true;
            case 1://ADMIN
                return ((discordHandler.admins.filter((value) => value === user.id)).length !== 0);//Admins are allowed to do commands, (people that aren't admins, can't do ANY commands)
            case 2://OWNER
                return ((discordHandler.owners.filter((value) => value === user.id)).length !== 0);//Owners are allowed to do EXTREME commands, such as eval
            default:
                return false;
        }
    }

    run(message, context){
        if(typeof this._func === "function"){
            log(2, `${message.author.username}[${message.author.id}] used the [${this.name}] command.`);
            return this._func(message, context);
        }
        else return false;
    }

    _resolveAlias(){
        for(let j = 0; j < this.alias.length; j++){
            if(typeof commands[this.alias[j]] !== "function"){
                commands[this.alias[j]] = commands[this.name];
            }
        }
    }
}

let commands = {
    // Gives basic info about the bot's uptime.
    ping: new command(0, function(message){
        log(2, `${message.author.username}[${message.author.id}] used the [PING] command.`);
        let txt = convertTimeToText(Date.now() - this.online);
        let embed = new discord.MessageEmbed()
            .setColor("#F6CD3E")
            .setTitle("Ping")
            .addField(`Bot's been online for`, txt)
            .addField("Bot will check for comic in", getTimer());
        message.channel.send({embed});
    }, "ping"),
    // To restart JUST the discord client, all other code still runs.
    restart: new command(1, function(message){
        log(2, `${message.author.username}[${message.author.id}] used the [RESTART] command.`);
        message.channel.send("🔃 Rebooting...").then((m) => {
            log(2, "Shutting down client.");
            this.rebootMsg = {m: m.id, c: m.channel.id};
            this.online = 0;
            this.client.destroy();
            setTimeout(this.reboot.bind(this), 5000);
        }).catch(this.reboot);
    }, "restart"),
    // Shutdown the ENTIRE process, not just the Discord Client. (Accessible by only Owners)
    shutdown: new command(2, function(message){
        log(2, `${message.author.username}[${message.author.id}] used the [SHUTDOWN] command.`);
        discordHandler.client.destroy();
        process.exit(0);
    }, "shutdown"),
    // It forces a check for a new comic instead of waiting for the timer to run out.
    checkforcomic: new command(1, function(message){
        message.channel.send("🔍 Searching...").then((m) => {
            checkForComic(false).then(function(found){
                if(!found) m.edit("🚫 No new comic found.");
                else m.delete();
            }).catch(console.error);
        }).catch(console.error);
    }, "checkForComic"),
    // Runs pure code via an `Eval()` then returns the result.
    eval: new command(2, function(message){
        log(2, `${message.author.username}[${message.author.id}] used the [EVAL] command.`);
        //Since @context is all lowercase, we need to re-get the arguments without lowercasing them.
        let code = message.content.split(` `);
        code.shift();
        code.shift();
        code = code.join(` `);

        //embed that is sent, [ output ] will be added once output is defined
        //and depending on [ output ] color will be set to RED/ERROR or GREEN/SUCCESS
        let embed = new discord.MessageEmbed()
            .setTitle(`Input`)
            .setDescription(`\`\`\`nx\n${code}\`\`\``)
            .setFooter({text: `Requested by ${message.author.tag} at ${getTime(new Date())}`, iconURL: message.author.avatarURL()});

        function clean(text){
            if(typeof (text) === `string`) return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else return text;
        }

        try{
            let evaled = eval(code);
            if(typeof evaled !== `string`) evaled = require(`util`).inspect(evaled);
            let cleaned = clean(evaled);
            embed.setColor("#00FF00");
            if(cleaned) embed.addField(`Output`, `\`\`\`nx\n${cleaned}\`\`\``);
        }
        catch(err){
            console.warn("Eval had an error:" + err.message);
            embed.setColor("#FF0000")
                .addField(`Output`, `\`\`\`nx\n${clean(err)}\`\`\``);
        }

        message.channel.send({embed});
    }, ["eval", "e"]),
    // Sends an email and a DM to the owners of the bot.
    notify: new command(1, function(message){
        message.channel.send(`Noted, the owner${this.owners.length > 1 ? "s" : ""} of the bot has been notified`);
        let messageToSend = `${message.author.tag} notified you on ${new Date(message.createdTimestamp)}.\nView at: ${message.url}\nMessage Contents: \n\n${message.content.substring(0, 1000)}${message.content.length > 1000 ? "(CUTOFF)" : ""}`;
        for(let i = 0; i < this.owners.length; i++){
            discordHandler.client.users.fetch(this.owners[i], {cache: false}).then(function(user){
                user.send(messageToSend).catch(console.error);
            });
        }
        emailHandler.sendNotification(message.author, messageToSend).catch(function(error){
            log(5, error);
        });
    }, ["notify", "notif"]),
    // Gives basic info about bot developer and repo.
    about: new command(0, function(message){
        let embed = new discord.MessageEmbed();
        embed.setColor("#00FF00")
            .setTitle("About")
            .setDescription(`I am a bot designed to grab comics from ${websiteHandler.downloadLocation} and post them in a discord channel.`)
            .addField("GitHub repo:", "https://github.com/Frustrated-Programmer/WebcomicDiscordPoster/")
            .addField("Programmer:", "https://frustratedprogrammer.com")
            .setFooter({text: "Coded by FrustratedProgrammer."});
        message.channel.send({embed});
    }, ["about", "credits", "help"])
};
log(3, "Set up discord commands.");
for(let i in commands){
    commands[i]._resolveAlias();
}
log(3, "Set up discord command's aliases.");

class discordHandlerClass{
    constructor(options){
        options = options || {};
        this.key = options.key;
        this.admins = options.admins;
        this.owners = options.owners;
        this.channelID = options.channelID;
        this.rebootMsg = false;
        this.online = 0;
        this.awaitingComic = false;
        log(2, "DiscordHandler: READY.");
        setTimeout(this.reboot.bind(this), 5000);
    }

    /**
     * This may be called reboot, but it actually just boots up the client,
     * it shouldn't ever run, if the client is currently online.
     */
    reboot(){
        log(2, `Starting Client.`);
        if(this.client && this.client.status !== 5) this.client.destroy();
        this.client = new discord.Client(undefined);
        this.client.on("ready", this.onReady.bind(this));
        this.client.on("messageCreate", this.onMessage.bind(this));
        this.client.on("error", this.onError.bind(this));
        this.client.on("shardDisconnect", this.onDisconnect.bind(this));
        this.client.login(this.key).then().catch(this.onError.bind(this));
        return true;
    }

    /**
     * Checks if the client is online, if not: reboot it.
     * @return {Promise<boolean>}
     */
    check(){
        return new Promise((cb) => {
            log(2, `Checking Client`);
            let reboot = true;
            if(this.client){
                reboot = false;
                switch(this.client.status){
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        reboot = true;
                        break;
                    default:
                        reboot = false;
                        break;
                }
            }
            if(reboot) cb(this.reboot());
            else cb(false);
        });
    }

    /**
     * On case the client disconnects from one of the few cases we run a `client.destroy()`
     */
    onDisconnect(){
        if(isBotDown) return;
        global.isBotDown = true;
        log(2, "Client disconnected safely");
        log(4, (new Date()).toString());
    }

    /**
     * When the client emits an error, it's mostly ran because it loses connection
     * @param {Error} error
     */
    onError(error){
        if(!isBotDown && this.client && this.client.status !== undefined){
            log(2, "Client turned off incorrectly at:");
            log(4, (new Date()).toString());
            errorHandler.onError(error).then(function(){
                botDown();
            }).catch(errorHandlerCrashed);
        }
        else{
            log(2, "Client turned off incorrectly, Error: " + error.message);
            log(4, (new Date()).toString());
            botDown();
        }
    }

    /**
     * For when the client is online and connected. Ready to send messages and gather data.
     */
    onReady(){
        log(2, "Client online");
        log(4, (new Date()).toString());
        global.isBotDown = false;
        this.online = Date.now();
        if(this.rebootMsg){
            this.client.channels.fetch(this.rebootMsg.c).then((channel) => {
                if(channel){
                    channel.messages.fetch(this.rebootMsg.m).then((msg) => {
                        msg.edit("✅ Rebooted.").catch(function(e){log(5, e);});
                        this.rebootMsg = false;
                    }).catch((e) => {
                        log(2, `Unable to find reboot msg. rebootMsg.m: ${this.rebootMsg.m}`);
                        log(5, e);
                    });
                }
                else log(2, `Unable to find channel that stored reboot msg. rebootMsg.c: ${this.rebootMsg.c}`);
            }).catch(function(e){
                log(5, e);
            });
        }
        if(this.awaitingComic){
            log(2, "Sending awaiting comic.");
            this.awaitingComic = false;
            this.sendComic(this.awaitingComic).catch(function(e){
                log(5, e);
            });
        }
    }

    /**
     * When the bot recieves a message. Typically ignores these unless pinged, then it awaits a command
     * @param {Message} message
     */
    onMessage(message){
        if(message.author.bot) return;
        let nxtCmd = "";
        let context = "";
        if(message.content.startsWith(`<@${this.client.user.id}>`) || message.content.startsWith(`<@&${this.client.user.id}>`) || message.content.startsWith(`<@!${this.client.user.id}>`)){
            if(message.content.startsWith(`<@${this.client.user.id}>`)){
                let x = message.content.toLowerCase().substring((`<@${this.client.user.id}>`).length, message.content.length).trim().split(" ");
                nxtCmd = x.splice(0, 1);
                context = x.join(" ");
            }
            else{
                let x = message.content.toLowerCase().substring((`<@!${this.client.user.id}>`).length, message.content.length).trim().split(" ");
                nxtCmd = x.splice(0, 1);
                context = x.join(" ");
            }
            let command = commands[nxtCmd];
            if(!command) return;
            if(command.hasPermission(message.author)){
                command.run(message, context);
            }
            else{
                message.channel.send(command.noPerms);
            }
        }
    }


    /**
     * When the INDEX.JS wants to send the comic, this is ran. It looks for the channel and then sends the comic.
     * @param retrievedData Object
     * @param retrievedData.imageLink String
     * @param retrievedData.websiteLink String
     */
    sendComic(retrievedData = {}){
        return new Promise((cb, rj) => {
            try{
                if(retrievedData === undefined) rj("Link isn't valid.");
                if(this.online === 0){
                    log(2, "Comic cannot send: Client isn't online.");
                    log(2, "Waiting for client to come online.");
                    this.awaitingComic = retrievedData;
                    cb();
                }
                this.client.channels.fetch(this.channelID).then((channel) => {
                    if(channel && channel.isText() && channel instanceof discord.TextChannel){
                        let actualSendComic = () => {
                            if(retrievedData.images.length > 1){
                                let textInsert = "";
                                for(let i = 0; i < retrievedData.links.length; i++){
                                    textInsert += `[View ${i === retrievedData.links.length ? "newest" : "new"} comic #${i + 1}](${retrievedData.links[i]})${i + 1 < retrievedData.links.length ? "\n" : ""}`;
                                }
                                let embed = new discord.MessageEmbed()
                                    .setColor("#0A5BD7")
                                    .setTitle(`${retrievedData.images.length} new Dreamland Chronicles Comics`)
                                    .setDescription((multipleComicsPostedMsg[Math.round(Math.random() * (multipleComicsPostedMsg.length - 1))]).replace("{num}", retrievedData.images.length))
                                    .setThumbnail(retrievedData.images[0])
                                    .setURL(retrievedData.links[0])
                                    .addField("\u200B", `${retrievedData.extra ? `\n[Go to previously posted.](${retrievedData.extra})` : ""}${textInsert}`);
                                channel.send({embeds:[embed]}).then(() => {
                                    log(2, `Sent latest comic page.`);
                                    cb(true);
                                }).catch((e) => {
                                    this.onError(e);
                                    rj(e);
                                });
                            }
                            else{
                                let embed = new discord.MessageEmbed()
                                    .setColor("#0A5BD7")
                                    .setTitle("New Dreamland Chronicles Comic")
                                    .setDescription(aComicPostedMsg[Math.round(Math.random() * (aComicPostedMsg.length - 1))])
                                    .setThumbnail(retrievedData.images[0])
                                    .setURL(retrievedData.links[0])
                                    .addField("\u200B", `[View it on the website.](${retrievedData.links[0]})${retrievedData.extra ? `\n[Go to previously posted.](${retrievedData.extra})` : ""}`);
                                channel.send({embeds:[embed]}).then(() => {
                                    log(2, `Sent latest comic page.`);
                                    cb(true);
                                }).catch((e) => {
                                    this.onError(e);
                                    rj(e);
                                });
                            }
                        };
                        if(savedData.pingEveryone === 1 || savedData.pingEveryone === 2){
                            channel.send("@everyone").then((msg) => {
                                if(savedData.pingEveryone === 2){
                                    msg.delete().catch(function(e){log(5,e)});
                                }
                                actualSendComic();
                            }).catch(rj);
                        }
                        else actualSendComic();

                    }
                    else{
                        log(2, `Unable to find channel to put current page. channelID: ${this.channelID}`);
                        rj("No channel");
                    }
                });

            }
            catch(e){
                rj(e);
            }
        });
    }

}

module.exports = discordHandlerClass;
