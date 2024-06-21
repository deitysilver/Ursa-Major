# Ursa-Major
Ursa-Major is a starboard bot that allows you to star yours and your friends iconic moments in your server

The bot is a cross-server and open source so you may invite this bot to your own server or if you want to modify it to suit your own server, you may use the code.

If you wish to create your own version of Ursa, first download the repository, then in the terminal type in the command ```npm install```, after that, create an file named ".env" in the main folder (do **not** add the ".env" file in the "src" folder).

Now go to the discord developer portal and set up a new bot/application: https://discord.com/developers/applications

After you do that, go to the ".env" file you created earlier and paste in this:

```
BOT_TOKEN={bot_token}
CLIENT_ID={client_id}
PUBLIC_KEY={public_key}
DATABASE_CHANNEL_ID={database_channel_id}
```


First off, in the developer portal, create a new bot token, and replace ```{bot_token}``` with the bot token (do **not** include the curly parenthesis/brackets). Then go to general information in the application's developer portal and copy the application id, then replace ```{client_id}``` with that application id. Now do the exact same thing with the public key, it's right under the application id in the developer portal. Now go to your discord server and create a private channel that no one else can see (preferably, create this channel in a completely seperate private server with no one else in it). Right click on the channel and copy the channel id (if it is not visible to you, go to app settings in discord and click on advanced, then toggle "Developer Mode"). Now replace ```{database_channel_id}``` with the channel id.

After saving the ".env" file, open the terminal and simply type in "nodemon" and press enter. If this does not work, install nodemon with the command "npm install -g nodemon". And if npm is not recognized, then install node js from: https://nodejs.org/en

If you have any further questions, send me a follow or message me on discord: deitysilver and I shall try assist you further in any way I can.
