# Dreamland Chronicles Comic Poster

### Setup
 * Make sure you have node installed.
 * Install the required dependencies `npm i`.
 * Make sure the code has permission can write to `savedData.json`.
 * Update `savedData.json` to have the key items.
 * Run `index.js` in a terminal via `node index.js`

### savedData.json
`savedData.json` needs to have 5 keys inside an object like so:
```json
{
    "key":"",
    "admins":[""],
    "channelID":"",
    "debugging":true,
    "latestComic":""
}
```
And `key` and `channelID` ***have*** to have a value.
 - `key` The key to the Discord bot.
 - `admins` An array of  Discord User IDs. (These are users who can run the 3 commands)
 - `channelID` An ID to the channel that the bot will post the picture to.
 - `debugging` A boolean. Changes whether the bot logs what it's doing or not.
 - `latestComic` The date of the latest comic. The bot updates this to prevent posting the same comic twice in case a comic isn't posted during it's update period.
 
 ### Commands
 The bot has 3 commands `ping`, `restart`, and `checkForComic`. To trigger one you need to ping the bot and have the command somewhere in the message  Eg: `@Comic-Bot checkforComic` or `will you restart please @Comic-Bot`. (commands are not case sensitive)
 - `ping` Will respond with a message saying how long the bot's been online for, and when it's next comic check is due.
 - `restart` Will restart JUST the discord bot.
 - `checkForComic` will check for a new comic and if one exists it will post the comic.
