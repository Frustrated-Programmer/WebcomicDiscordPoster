/**
 * The DiscordHandler is the part that takes care of the user side of things.
 * Here we make sure the client is online as much as possible,
 * Reboot itself when the client goes down,
 * and of course when prompted send the Comic Strip to the desired channel.
 */
const discord = require("discord.js");
const fs = require("fs");
let contentMsg = ["Hey @everyone, a new Dreamland Comic has been posted:", "@everyone, please turn your attention to the new Dreamland Comic:", "Attention @everyone, a new Dreamland Comic:"];

/**
 * Get a formatted version of Date & Time.
 * @param {DateConstructor} time
 * @return {string}
 */
function getTime(time){
    let mins = time.getMinutes();
    let minutes = `00`;
    minutes = minutes.substring(`${mins}`.length);
    return `${`${time.getHours() > 12 ? time.getHours() - 12 : time.getHours()}:${minutes}${mins} ${time.getHours() > 12 ? `PM` : `AM`}`}`;
}

//Used in case the eval command uses a console.log .error or .warn The .dir is left due to me not wanting to try to reproduce it.
let console = {
    log: function(item){
        log(103, item);
    },
    warn: function(){
        log(103, "[WARN] " + item);
    },
    error: function(item){
        log(105, item);
    }
};

class discordHandler{
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
     * it shouldn't ever be ran if the client is currently online.
     */
    reboot(){
        log(2, `Starting Client.`);
        if(this.client && this.client.status !== 5) this.client.destroy();
        this.client = new discord.Client();
        this.client.on("ready", this.onReady.bind(this));
        this.client.on("message", this.onMessage.bind(this));
        this.client.on("error", this.onError.bind(this));
        this.client.on("disconnect", this.onDisconnect.bind(this));
        this.client.login(this.key).then().catch(this.onError.bind(this));
    }

    /**
     * On case the client disconnects from one of the few cases we run a `client.destroy()`
     */
    onDisconnect(){
        if(isBotDown) return;
        isBotDown = true;
        log(2, "Client disconnected safely");
        log(4, (new Date()).toString());
    }

    /**
     * When the client emits an error, it's mostly ran because it loses connection
     * @param {Error} error
     */
    onError(error){
        if(!isBotDown && this.client && this.client.status !== undefined){
            this.client.destroy().then(function(){
                log(2, "Client turned off incorrectly at:");
                log(4, (new Date()).toString());
                errorHandler.onError(error).then(function(){
                    botDown();
                }).catch(errorHandlerCrashed);
            }).catch(function(e){
                console.error(e);
                log(4, (new Date()).toString());
                botDown();
            });
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
        isBotDown = false;
        this.online = Date.now();
        if(this.rebootMsg){
            let channel = this.client.channels.get(this.rebootMsg.c);
            if(channel){
                channel.fetchMessage(this.rebootMsg.m).then(function(msg){
                    msg.edit("✅ Rebooted.");
                    this.rebootMsg = false;
                }).catch((e) => {
                    log(2, `Unable to find reboot msg. rebootMsg.m: ${this.rebootMsg.m}`);
                });
            }
            else log(2, `Unable to find channel that stored reboot msg. rebootMsg.c: ${this.rebootMsg.c}`);
        }
        if(this.awaitingComic){
            log(2, "Sending comic.");
            this.sendComic(this.awaitingComic);
            this.awaitingComic = false;
        }
    }

    /**
     * When the bot recieves a message. Typically ignores these unless pinged, then it awaits a command
     * @param {Message} message
     */
    onMessage(message){
        let isAdmin = ((this.admins.filter((value) => value === message.author.id)).length !== 0);
        let isOwner = ((this.owners.filter((value) => value === message.author.id)).length !== 0);
        let mention = false;
        let nxtCmd = "";
        if(message.content.startsWith(`<@${this.client.user.id}>`) || message.content.startsWith(`<@&${this.client.user.id}>`) || message.content.startsWith(`<@!${this.client.user.id}>`)){
            mention = true;
            if(message.content.startsWith(`<@${this.client.user.id}>`)){
                nxtCmd = message.content.toLowerCase().substring((`<@${this.client.user.id}>`).length, message.content.length).trim().split(" ")[0];
            }
            else{
                nxtCmd = message.content.toLowerCase().substring((`<@!${this.client.user.id}>`).length, message.content.length).trim().split(" ")[0];
            }
        }
        if(!isAdmin || !mention) return;
        if(nxtCmd === "adminTest"){
            // this.channelID = msg.channel.id;
        }
        else if(nxtCmd === "ping") this.ping(message);
        else if(nxtCmd === "restart") this.restart(message);
        else if(nxtCmd === "shutdown"){
            if(isOwner) process.exit(0);
            else message.channel.send("I'm sorry, but only the Owner of the bot can use this command");
        }
        else if(nxtCmd === "checkforcomic") this.checkComic(message);
        else if(nxtCmd === "eval"){
            if(isOwner) this.eval(message);
            else message.channel.send("I'm sorry, but only the Owner of the bot can use this command");
        }
        else if(nxtCmd === "notify" || nxtCmd === "notif") this.notify(message);
        else if(nxtCmd === "about" || nxtCmd === "credits" || nxtCmd === "help") this.about(message);


    }

    /**
     * When the INDEX.JS wants to send the comic, this is ran. It looks for the channel and then sends the comic.
     * @param link
     */
    sendComic(link){
        if(this.online === 0){
            log(2, "Comic cannot send: Client isn't online.");
            log(2, "Waiting for client to come online.");
            this.awaitingComic = link;
            return;
        }
        let channel = this.client.channels.get(this.channelID);
        if(channel){
            channel.send(contentMsg[Math.round(Math.random() * (contentMsg.length - 1))], {
                files: [link]
            }).then(() => {
                log(2, `Sent latest comic page.`);
            }).catch(this.onError.bind(this));
        }
        else log(2, `Unable to find channel to put current page. channelID: ${this.channelID}`);
    }

    /**
     * To restart JUST the discord client, all other code still runs.
     * @param {Message} message
     */
    restart(message){
        log(2, `${message.author.username}[${message.author.id}] used the [RESTART] command.`);
        message.channel.send("🔃 Rebooting...").then((m) => {
            log(2, "Shutting down client.");
            this.rebootMsg = {m: m.id, c: m.channel.id};
            this.online = 0;
            this.client.destroy();
            setTimeout(this.reboot.bind(this), 5000);
        }).catch(this.reboot);
    }

    /**
     * For when the `checkForComic` command is run.
     * It forces a check for a new comic instead of waiting for the timer to run out.
     * @param {Message} message
     */
    checkComic(message){
        log(2, `${message.author.username}[${message.author.id}] used the [checkForComic] command.`);
        message.channel.send("🔍 Searching...").then((m) => {
            checkForComic().then(function(found){
                if(!found) m.edit("🚫 No new comic found.");
                else m.delete();
            }).catch(console.error);
        }).catch(console.error);
    }

    /**
     * For when the `ping` command is run.
     * Gives basic info about the bot's uptime.
     * @param {Message} message
     */
    ping(message){
        log(2, `${message.author.username}[${message.author.id}] used the [PING] command.`);
        let date = Date.now() - this.online;
        let time = [];
        let second = 1000;
        let minute = second * 60;
        let hour = minute * 60;
        let day = hour * 24;
        let times = [day, hour, minute, second];
        for(let i = 0; i < times.length; i++){
            time.push(0);
            while(date > times[i]){
                time[i]++;
                date -= times[i];
            }
        }
        let amount = "";
        if(time[0] > 0) amount += `Days: [${time[0]}] `;
        if(time[1] > 0) amount += `Hours: [${time[1]}] `;
        if(time[2] > 0) amount += `Minutes: [${time[2]}] `;
        if(time[3] > 0 && time[0] === 0) amount += `Seconds: [${time[3]}] `;
        if(date > 0 && time[0] === 0 && time[1] === 0) amount += `Milliseconds: [${date}]`;

        let embed = new discord.RichEmbed()
            .setColor("#F6CD3E")
            .setTitle("Ping")
            .addField(`Bot's been online for`, amount)
            .addField("Bot will check for comic in", getTimer());
        message.channel.send({embed});
    }

    /**
     * For when the `eval` command is run.
     * Runs pure code via an `Eval()` then returns the result.
     * @param {Message} message
     */
    eval(message){
        //Since @args is all lowercase, we need to re-get the arguments without lowercasing them.
        let code = message.content.split(` `);
        code.shift();
        code.shift();
        code = code.join(` `);

        //embed that is sent, [ output ] will be added once output is defined
        //and depending on [ output ] color will be set to RED/ERROR or BLUE/SUCCESS
        let embed = new discord.RichEmbed()
            .setTitle(`Input`)
            .setDescription(`\`\`\`nx\n${code}\`\`\``)
            .setFooter(`Requested by ${message.author.tag} at ${getTime(new Date())}`, message.author.avatarURL);

        function clean(text){
            if(typeof (text) === `string`)
                return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else
                return text;
        }

        try{
            let evaled = eval(code);
            if(typeof evaled !== `string`)
                evaled = require(`util`).inspect(evaled);
            embed.setColor("#0000FF")
                .addField(`Output`, `\`\`\`nx\n${clean(evaled)}\`\`\``);
        }
        catch(err){
            embed.setColor("#FF0000")
                .addField(`Output`, `\`\`\`nx\n${clean(err)}\`\`\``);
        }

        message.channel.send({embed});
    }

    /**
     * For when the `About` or `Help` command is run.
     * Gives basic info about bot developer and repo.
     * @param msg
     */
    about(msg){
        let embed = new discord.RichEmbed();
        embed.setColor("#00FF00")
            .setTitle("About")
            .setDescription("I am a bot designed to grab comics from http://www.thedreamlandchronicles.com/ and post them in a discord channel.")
            .addField("GitHub repo:", "https://github.com/Frustrated-Programmer/DreamlandChroniclesDiscordBot/")
            .addField("Programmer:", "https://frustratedprogrammer.com")
            .setFooter("Coded by FrustratedProgrammer.");
        msg.channel.send({embed});
    }

    /**
     * For when the `notify` command is run.
     * Sends an email and a DM to the owners of the bot.
     * @param message
     */
    notify(message){
        message.channel.send(`Noted, the owner${this.owners.length > 1 ? "s" : ""} of the bot has been notified`);
        let messageToSend = `${message.author.tag} notified you on ${message.createdTimestamp}.\nView at: ${message.url}`;
        for(let i = 0; i < this.owners.length; i++){
            this.client.users.fetch(this.owners[i]).then((user) => {
                user.send(messageToSend).catch(console.error);
            }).catch(console.error);
        }
        emailHandler.sendNotif(message.author, messageToSend);
    }
}

module.exports = discordHandler;
