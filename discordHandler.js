const discord = require("discord.js");
const fs = require("fs");
let contentMsg = ["Hey @everyone, a new Dreamland comic has been posted:"]
function getTime(time){
    let mins = time.getMinutes();
    let minutes = `00`;
    minutes = minutes.substring(`${mins}`.length);
    return `${`${time.getHours() > 12 ? time.getHours() - 12 : time.getHours()}:${minutes}${mins} ${time.getHours() > 12 ? `PM` : `AM`}`}`;
}

let console = {
    log: function(item){
        log(3, item);
    },
    error: function(item){
        log(5, item);
    }
};

class discordHandler{
    constructor(options){
        options = options || {};
        this.key = options.key;
        this.admins = options.admins;
        this.owners = options.owners;
        this.debugging = options.debugging || false;
        this.channelID = options.channelID;
        this.rebootMsg = false;
        this.online = 0;
        this.awaitingComic = false;
        log(2, "DiscordHandler: Started.");
        this.reboot();
    }

    reboot(){
        log(2, `Starting Client.`);
        this.client = new discord.Client();
        this.client.login(this.key);
        this.client.on("ready", this.onReady.bind(this));
        this.client.on("message", this.onMessage.bind(this));
        this.client.on("error",this.onError.bind(this));
        this.client.on('disconnect',this.onDisconnect.bind(this));
    }
    onDisconnect(){
        if(isBotDown) return;
        isBotDown = true;
        log(2,"Client disconnected safely");
        log(4,(new Date()).toString());
    }
    onError(errorCode){
        if(isBotDown) return;
        this.client.destroy().then(
            function(){
                log(2,"Client turned off incorrectly, Error: "+errorCode.message);
                log(4,(new Date()).toString())
                botDown();
            }
        ).catch(function(e){
            console.error(e);
            log(4,(new Date()).toString())
            botDown();
        })
    }
    onReady(){
        log(2, "Client online");
        log(4,(new Date()).toString())
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

    onMessage(msg){
        let isAdmin = ((this.admins.filter((value) => value === msg.author.id)).length !== 0);
        let isOwner = ((this.owners.filter((value) => value === msg.author.id)).length !== 0);
        let mention = false;
        let nxtCmd = "";
        if(msg.content.startsWith(`<@${this.client.user.id}>`) || msg.content.startsWith(`<@&${this.client.user.id}>`) || msg.content.startsWith(`<@!${this.client.user.id}>`)){
            mention = true;
            if(msg.content.startsWith(`<@${this.client.user.id}>`)){
                nxtCmd = msg.content.toLowerCase().substring((`<@${this.client.user.id}>`).length, msg.content.length).trim().split(" ")[0];
            }
            else{
                nxtCmd = msg.content.toLowerCase().substring((`<@!${this.client.user.id}>`).length, msg.content.length).trim().split(" ")[0];
            }
        }
        if(!isAdmin || !mention) return;
        if(nxtCmd === "adminTest"){
           // this.channelID = msg.channel.id;
        }
        else if(nxtCmd === "ping") this.ping(msg);
        else if(nxtCmd === "restart") this.restart(msg);
        else if(nxtCmd === "checkforcomic") this.checkComic(msg);
        else if(nxtCmd === "eval"){
            if(isOwner) this.eval(msg);
            else msg.channel.reply("I'm sorry, but only the Owner of the bot can use this command");
        }
        else if(nxtCmd === "about" || nxtCmd === "credits" || nxtCmd === "help") this.about(msg);


    }

    sendComic(link){
        if(this.online === 0){
            log(2, "Comic cannot send: Client isn't online.");
            log(2, "Waiting for client to come online.");
            this.awaitingComic = link;
            return;
        }
        let channel = this.client.channels.get(this.channelID);
        if(channel){
            channel.send(contentMsg[Math.round(Math.random() * (contentMsg.length-1))],{
                files: [link]
            }).then(() => {
                log(2, `Sent latest comic page.`);
            }).catch(console.error);
        }
        else log(2, `Unable to find channel to put current page. channelID: ${this.channelID}`);
    }

    restart(msg){
        log(2, `${msg.author.username}[${msg.author.id}] used the [RESTART] command.`);
        msg.channel.send("🔃 Rebooting...").then((m) => {
            log(2, "Shutting down client.");
            this.rebootMsg = {m: m.id, c: m.channel.id};
            this.online = 0;
            this.client.destroy();
            setTimeout(this.reboot.bind(this), 5000);
        }).catch(this.reboot);
    }

    checkComic(msg){
        log(2, `${msg.author.username}[${msg.author.id}] used the [checkForComic] command.`);
        msg.channel.send("🔍 Searching...").then((m) => {
            checkForComic().then(function(found){
                if(!found) m.edit("🚫 No new comic found.");
                else m.delete();
            }).catch(console.error);
        }).catch(console.error);
    }

    ping(msg){
        log(2, `${msg.author.username}[${msg.author.id}] used the [PING] command.`);
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
        msg.channel.send({embed});
    }

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

}

module.exports = discordHandler;
