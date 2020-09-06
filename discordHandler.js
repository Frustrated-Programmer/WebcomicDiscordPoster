const discord = require("discord.js");
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
class discordHandler{
    constructor(options,checkForComic,getTimer){
        options = options || {};
        this.checkForComic = checkForComic;
        this.getTimer = getTimer;
        this.key = options.key;
        this.admins = options.admins;
        this.debugging = options.debugging || false;
        this.channelID = options.channelID;
        this.rebootMsg = false;
        this.online = 0;
        this.awaitingComic = false;
        this.log("DiscordHandler: Started.");
        this.reboot();
    }
    reboot(){
        this.log(`Starting Client.`);
        this.client = new discord.Client();
        this.client.login(this.key);
        this.client.on("ready", this.onReady.bind(this));
        this.client.on("message", this.onMessage.bind(this));
    }
    onReady(){
        this.log("Client online");
        this.online = Date.now();
        if(this.rebootMsg){
            this.client.channels.fetch(this.rebootMsg.c).then((channel)=>{
                channel.messages.fetch(this.rebootMsg.m).then((message)=>{
                    message.edit('✅ Rebooted.');
                    this.rebootMsg = false;
                });
            });
        }
        if(this.awaitingComic){
            this.log('Sending comic.');
            this.sendComic(this.awaitingComic);
            this.awaitingComic = false;
        }
    }
    onMessage(msg){
        let isAdmin = ((this.admins.filter((value) => value === msg.author.id)).length !== 0);
        let mention = msg.mentions.has(this.client.user,{ignoreRoles:true,ignoreEveryone:true});
        if(!isAdmin || !mention) return;
        if(msg.content.toLowerCase().includes("ping")) this.ping(msg);
        if(msg.content.toLowerCase().includes("restart"))this.restart(msg);
        if(msg.content.toLowerCase().includes("checkforcomic"))this.checkComic(msg);

    }
    sendComic(link){
        if(this.online === 0){
            this.log('Comic cannot send: Client isn\'t online.');
            this.log('Waiting for client to come online.');
            this.awaitingComic = link;
            return;
        }
        this.client.channels.fetch(this.channelID).then((channel)=>{
            channel.send({
                files: [link]
            }).then(()=>{
                this.log(`Sent latest comic page.`);
            });
        });
    }
    restart(msg){
        this.log(`${msg.author.username}[${msg.author.id}] used the [RESTART] command.`);
        msg.channel.send("🔃 Rebooting...").then((m) => {
            this.log('Shutting down client.')
            this.rebootMsg = {m:m.id,c:m.channel.id};
            this.online = 0;
            this.client.destroy();
            setTimeout(this.reboot.bind(this),5000);
        }).catch(this.reboot);
    }
    checkComic(msg){
        this.log(`${msg.author.username}[${msg.author.id}] used the [checkForComic] command.`);
        this.checkForComic();
    }
    ping(msg){
        this.log(`${msg.author.username}[${msg.author.id}] used the [PING] command.`);
        let date = Date.now() - this.online;
        let time = [];
        let second = 1000;
        let minute = second * 60;
        let hour = minute * 60;
        let day = hour * 24;
        let times = [day,hour,minute,second];
        for(let i =0;i<times.length;i++){
            time.push(0);
            while (date > times[i]){
                time[i] ++;
                date-=times[i];
            }
        }
        let amount = "";
        if(time[0] > 0) amount+=`Days: [${time[0]}] `;
        if(time[1] > 0) amount+=`Hours: [${time[1]}] `;
        if(time[2] > 0) amount+=`Minutes: [${time[2]}] `;
        if(time[3] > 0 && time[0] === 0) amount+=`Seconds: [${time[3]}] `;
        if(date > 0 && time[0] === 0 && time[1] === 0) amount+=`Milliseconds: [${date}]`;

        let embed = new discord.MessageEmbed()
            .setColor("#F6CD3E")
            .setTitle("Ping")
            .addField(`Bot's been online for`,amount)
            .addField('Bot will check for comic in',this.getTimer());
        msg.channel.send({embed})
    }
    log(text){
        if(this.debugging)console.log("[\x1b[32mDISCORD\x1b[0m]", text);
    }
}

module.exports = discordHandler;
