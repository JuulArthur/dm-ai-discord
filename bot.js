import {Client, GatewayIntentBits} from 'discord.js';
import {joinVoiceChannel} from '@discordjs/voice';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildVoiceStates] });
import "dotenv/config";
let voiceChannel;
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'dm-join') {
        voiceChannel = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        })
        await interaction.reply('Hello there!');
    } else if (interaction.commandName === 'dm-leave') {
        voiceChannel.disconnect();
        await interaction.reply('Bye then!');
    }
});

client.on("messageCreate", (message) => {
    if (message.content.startsWith("ping")) {
        message.channel.send("pong!");
    } else

    if (message.content.startsWith("foo")) {
        message.channel.send("bar!");
    }
});

client.login(process.env.BOT_TOKEN);