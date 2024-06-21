const { Client, GatewayIntentBits, EmbedBuilder, Partials, SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require("discord.js");
const { config } = require("dotenv");

config();

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const PREFIX = '/';

const rest = new REST({ version: "10" }).setToken(TOKEN);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
    ],
});

const STAR_EMOJI = '⭐';
const DATABASE_CHANNEL_ID = "1253658066260463707";

const starboardMessages = new Map();

client.on("ready", async () => {
    console.log("Bot is ready");

    const databaseChannel = client.channels.cache.get(DATABASE_CHANNEL_ID);

    if (!databaseChannel) {
        console.error(`Database channel with ID ${DATABASE_CHANNEL_ID} not found.`);
        return;
    }

    try {
        const messages = await databaseChannel.messages.fetch();
        messages.forEach(async (msg) => {
            const match = msg.content.match(/\((.+?)\) \{(.+?)\} \[(\d+)\]/);
            if (match) {
                const guildId = match[1];
                const starboardChannelId = match[2];
                const starThreshold = parseInt(match[3], 10);
                starboardMessages.set(guildId, { starboardChannelId, starThreshold });
            }
        });
        console.log(`Starboard configurations loaded from database.`);
    } catch (error) {
        console.error(`Error fetching messages from database channel: ${error}`);
    }
});

const setStarBoard = new SlashCommandBuilder()
    .setName('setstarboard')
    .setDescription('Set starboard configuration')
    .addSubcommand(subcommand =>
        subcommand
            .setName('config')
            .setDescription('Configure starboard settings')
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel to set as starboard')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('threshold')
                    .setDescription('Number of stars required to be added to starboard')
                    .setRequired(true)
            )
    );

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options, guild } = interaction;

    if (commandName === 'setstarboard') {
        const subcommand = options.getSubcommand();

        if (subcommand === 'config') {
            const channelArg = options.getChannel('channel');
            const thresholdArg = options.getInteger('threshold');

            if (!channelArg || !thresholdArg || thresholdArg < 1) {
                return interaction.reply({ content: 'Please provide a valid channel and a threshold greater than 0.', ephemeral: true });
            }

            const starboardChannelId = channelArg.id;
            const starThreshold = thresholdArg;

            const databaseChannel = client.channels.cache.get(DATABASE_CHANNEL_ID);

            if (!databaseChannel) {
                return interaction.reply({ content: `The database channel does not exist.`, ephemeral: true });
            }

            try {
                const existingMessage = databaseChannel.messages.cache.find(msg => {
                    const match = msg.content.match(/\((.+?)\)/);
                    return match && match[1] === guild.id;
                });

                if (existingMessage) {
                    await existingMessage.edit(`(${guild.id}) {${starboardChannelId}} [${starThreshold}]`);
                    await interaction.reply(`Updated starboard configuration for this server. Channel: <#${starboardChannelId}>, Threshold: ${starThreshold}.`);
                } else {
                    await databaseChannel.send(`(${guild.id}) {${starboardChannelId}} [${starThreshold}]`);
                    await interaction.reply(`Starboard configuration set for this server. Channel: <#${starboardChannelId}>, Threshold: ${starThreshold}.`);
                }

                starboardMessages.set(guild.id, { starboardChannelId, starThreshold });
            } catch (error) {
                console.error(`Failed to set/update starboard configuration: ${error}`);
                await interaction.reply({ content: 'Failed to set/update starboard configuration.', ephemeral: true });
            }
        }
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name === STAR_EMOJI) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        if (!user.bot && reaction.message.guild) {
            const { message } = await reaction;
            const guildId = message.guild.id;

            if (starboardMessages.has(guildId)) {
                const { starboardChannelId, starThreshold } = starboardMessages.get(guildId);

                if (reaction.count >= starThreshold && !starboardMessages.has(message.id)) {
                    const starboardChannel = client.channels.cache.get(starboardChannelId);

                    if (starboardChannel) {
                        let messageAttachment = reaction.message.attachments.size > 0 ? reaction.message.attachments.first().url : null;
                        let messageContent = message.content || ' ';

                        const embed = new EmbedBuilder()
                            .setColor(0xffffff)
                            .setAuthor({ name: user.username, iconURL: `${user.displayAvatarURL()}` })
                            .setThumbnail(`${reaction.message.author.displayAvatarURL()}`)
                            .addFields(
                                { name: 'Starred Message:', value: `${messageContent}` },
                            );

                        if (messageAttachment) {
                            embed.setImage(`${messageAttachment}`)
                                .setTimestamp();
                        }

                        starboardChannel.send({ embeds: [embed] })
                            .then(sentMessage => {
                                console.log("Message sent to starboard:", sentMessage.id);
                                starboardMessages.set(message.id, sentMessage.id);
                            })
                            .catch(err => {
                                console.error('Error sending message to starboard:', err);
                            });
                    } else {
                        console.log("Starboard channel not found");
                    }
                } else {
                    console.log("Message does not meet star threshold or already in starboard");
                }
            } else {
                console.log(`Starboard configuration not found for guild ${guildId}`);
            }
        } else {
            console.log("Either a bot or not in a guild");
        }
    } else {
        console.log("Reaction is not a star emoji");
    }
});

const commands = [
    setStarBoard.toJSON(),
];

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: commands,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        client.login(TOKEN);
    } catch (error) {
        console.error(`Failed to deploy application commands: ${error}`);
    }
})();
