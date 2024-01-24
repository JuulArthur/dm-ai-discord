import {Client, GatewayIntentBits} from 'discord.js';
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnection,
    StreamType, VoiceConnectionStatus,
} from '@discordjs/voice';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildVoiceStates] });
import "dotenv/config";
import { createListeningStream } from './createListeningStream.js';

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

const connectToVoiceChannelMusic = async ({interaction}) => {
    connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    })

    connection.subscribe(player);
    await interaction.reply('Hello there!');
}


const connectToVoiceChannel = async ({interaction}) => {
    connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    })

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20e3);

        await createListeningStream({interaction, connection})
    } catch (error) {
        console.warn(error);
        await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
    }

    await interaction.reply('Ready!');
}

async function leave({
                         interaction,
                     }) {
    if (connection) {
        connection.destroy();
        await interaction.reply({ ephemeral: true, content: 'Left the channel!' });
    } else {
        await interaction.reply({ ephemeral: true, content: 'Not playing in this server!' });
    }
}

async function record(
    interaction,
) {
    if (connection) {
        const userId = interaction.options.get('speaker').value;

        const receiver = connection.receiver;
        if (connection.receiver.speaking.users.has(userId)) {
            createListeningStream(receiver, userId, client.users.cache.get(userId));
        }

        await interaction.reply({ ephemeral: true, content: 'Listening!' });
    } else {
        await interaction.reply({ ephemeral: true, content: 'Join a voice channel and then try that again!' });
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'dm-join') {
        await connectToVoiceChannel({interaction});
    } else if (interaction.commandName === 'dm-leave') {
        //connection.disconnect();
        await leave({interaction})
    } else if (interaction.commandName === 'dm-music') {
        await playSong();
        await interaction.reply('Blasting music!');
    } else if (interaction.commandName === 'dm-stop-music') {
        await stopSong();
        await interaction.reply('So quiet...');
    } else if (interaction.commandName === 'record') {
        await record();
        await interaction.reply('Im listening');
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