import {Client, GatewayIntentBits} from 'discord.js';
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnection,
    StreamType
} from '@discordjs/voice';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildVoiceStates] });
import "dotenv/config";

let connection;
const player = createAudioPlayer();

const playSong = () => {
    const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
        inputType: StreamType.Arbitrary,
    });

    player.play(resource);

    return entersState(player, AudioPlayerStatus.Playing, 5000);
}

const stopSong = () => {
    player.stop();
    return;
}

const connectToVoiceChannel = ({interaction}) => {
    connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    })

    connection.subscribe(player);
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'dm-join') {
        connectToVoiceChannel({interaction});
        await interaction.reply('Hello there!');
    } else if (interaction.commandName === 'dm-leave') {
        connection.disconnect();
        await interaction.reply('Bye then!');
    } else if (interaction.commandName === 'dm-music') {
        await playSong();
        await interaction.reply('Blasting music!');
    } else if (interaction.commandName === 'dm-stop-music') {
        await stopSong();
        await interaction.reply('So quiet...');
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