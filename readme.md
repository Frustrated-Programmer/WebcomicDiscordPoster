# Online Comic Poster for Discord

### Setup
 * Make sure you have node installed.
 * Install the required dependencies `npm i`.
 * Make sure the code has permission can write to `data.json`.
 * Update `data.json` to have the key items.
 * Run `index.js` in a terminal via `node index.js`
 * go to your comic's domain page and find a way to access the latest comic every single time. (generally homepage) Then go into `websiteHandler.js` and edit `getCurrentPageImgLink` & `getCurrentPageDate` to extract the info from the page.
 * *If you need help on the last step lemme know so I can help, it's a difficult step.*

### data.json
`data.json` needs to have these keys inside an object like so:
```json
{
    "key":"",
    "admins":[""],
    "owners": [""],
    "channelID":"",
    "debugging":true,
    "latestComic":"",
	"useEmailHandler": false,
    "host": "",
    "port": 0,
    "sender": "",
    "receiver": "",
    "auth": {
        "user": "",
        "pass": ""
    }
}
```
And `key` and `channelID` ***have*** to have a value.
 - `key` The key to the Discord bot.
 - `admins` An array of Discord User IDs. (These are users who can run the 3 commands)
 - `owners` An array of Discord User IDs. (These are users who can run the eval command)
 - `channelID` An ID to the channel that the bot will post the picture to.
 - `debugging` A boolean. Changes whether the bot logs what it's doing or not.
 - `latestComic` The date of the latest comic. The bot updates this to prevent posting the same comic twice in case a comic isn't posted during it's update period.
 - `useEmailHandler` Whether or not to try to send an email whenever the bot errors or something bad happens. 
 - `host`,`port`,`sender`,`reciever`, `auth.user`, & `auth.pass` are only required if `useEmailHandler` is set to true. If so, Further instructions are supplied later.
 
 ### Email Handler
 You can learn more about how to use the API I am using called [nodemailer](nodemailer.com/about
 ).<br>If you decide to have `useEmailHandler` in the `data.json` set to true, the following will need to be filled out depending on your transport method:
  - `host` the website/server with email capabilities. Looks like `smtp.site.com` or `mail.site.com`
  - `port` the port number the email server chose to expose. 
  - `sender` what to make the sender of the email appear like.
  - `reciever` what email to send the email to. Can be multible emails separated by commas `,`
  - `auth` The entire `auth` object is passed in as is to the webmailer. Most of the time `auth` is an object containing:
    - `user` username to log into the webmailer
    - `pass` password to log into the webmailer
 

 
 ### Commands
 The bot has 5 commands, (listed down below). To trigger one you need to start your message by pinging the bot, followed by the command.  Eg: `@Comic-Bot checkforComic` or `@Comic-Bot restart`. (commands are not case sensitive)
 - `ping` Will respond with a message saying how long the bot's been online for, and when it's next comic check is due.
 - `restart` Will restart JUST the discord bot.
 - `shutdown` Shuts down the entire code.
 - `checkForComic` will check for a new comic and if one exists it will post the comic.
 - `eval` will run any code you post AFTER the eval command.
 - `notif` | `notify` will notify owners of the bot via email(if setup) and DM something is happening. Useful for emergencies or bug-reports.
 - `help` | `about` | `credits` Will share info about the bot.
 
