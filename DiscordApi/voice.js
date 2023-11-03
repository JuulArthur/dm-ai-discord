import "dotenv/config";
import { Client, VoiceChannel, Intents } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { createDiscordJSAdapter } from './adapter.js';

const player = createAudioPlayer();

function playSong() {
  const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
    inputType: StreamType.Arbitrary,
  });

  player.play(resource);

  return entersState(player, AudioPlayerStatus.Playing, 5000);
}

async function connectToChannel(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: createDiscordJSAdapter(channel),
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    return connection;
  } catch (error) {
    connection.destroy();
    throw error;
  }
}

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

client.login(process.env.DISCORD_TOKEN);

client.on('ready', async () => {
  console.log('Discord.js client is ready!');

  try {
    await playSong();
    console.log('Song is ready to play!');
  } catch (error) {
    console.error(error);
  }
});

export const handleConnectToChannelInteraction = async ({guild, member}) => {
  if (!guild) return;

    const channel = member?.voice.channel;

    if (channel) {
      try {
        const connection = await connectToChannel(channel);
        connection.subscribe(player);
        message.reply('Playing now!');
      } catch (error) {
        console.error(error);
      }
    } else {
      message.reply('Join a voice channel then try again!');
    }
}

client.on('message', async (message) => {
  if (!message.guild) return;

  if (message.content === '-join') {
    const channel = message.member?.voice.channel;

    if (channel) {
      try {
        const connection = await connectToChannel(channel);
        connection.subscribe(player);
        message.reply('Playing now!');
      } catch (error) {
        console.error(error);
      }
    } else {
      message.reply('Join a voice channel then try again!');
    }
  }
});