# Online Comic Poster for Discord

### Setup
 * Make sure you have node installed.
 * Install the required dependencies `npm i`.
 * Make sure the code has permission can write to `data.json`.
 * Update `data.json` to have the key items.
 * Run `index.js` in a terminal via `node index.js`
 * go to your comic's domain page and find a way to access the latest comic every single time. (generally homepage) Then go into `websiteHandler.js` and edit:
   * `getCurrentPageImgLink` - To grab the page's IMAGE url,
   * `getCurrentPageDifferential` to extract the info from the page that tells it whether this page is different from the last(I recommend date).
   * `getDownloadLocation` to tell the handler what is the link to extract the data from. (use the passed in object to store incrementals in case the link changes whenever a comic is posted, Eg: _comic/page1.html, comic/page2.html, comic/page3.html_)
   * `comicWasPosted` to add to any increments in case website's link changes per comic. 
 * *If you need help on the last step lemme know so I can help, it's a difficult step.*

### data.json
`data.json` needs to have these keys inside an object like so:
```json
{
    "key":"",
    "admins":[""],
    "owners": [""],
	"updateTimer": "",
    "channelID":"",
    "debugging":true,
	"useEmailHandler": false,
    "host": "",
    "port": 0,
    "sender": "",
    "receiver": "",
    "auth": {
        "user": "",
        "pass": ""
    },
    "websiteHandlerData": {},
    "pingEveryone": 0
}
```
And `key` and `channelID` ***have*** to have a value.
 - `key` The key to the Discord bot.
 - `admins` An array of Discord User IDs. (These are users who can run the 3 commands)
 - `owners` An array of Discord User IDs. (These are users who can run the eval command)
 - `updateTimer` After how many milliseconds should the bot check for the comic?. (86400000 = once per day)
 - `channelID` An ID to the channel that the bot will post the picture to.
 - `debugging` A boolean. Changes whether the bot logs what it's doing or not.
 - `useEmailHandler` Whether or not to try to send an email whenever the bot errors or something bad happens. 
 - `host`,`port`,`sender`,`reciever`, `auth.user`, & `auth.pass` are only required if `useEmailHandler` is set to true. If so, Further instructions are supplied later.
 - `websiteHandlerData` can be whatever you need. It gets passed in to the websiteHandler for your customization, and is saved with every comic posted
 - `pingEveryone` can be 0 for no, 1 for yes, 2 to ghost ping everyone.
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
 
