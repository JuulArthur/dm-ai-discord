import { REST, Routes } from 'discord.js';
import "dotenv/config";

const commands = [
  {
    name: 'dm-join',
    description: 'Joins channel!',
  },

  {
    name: 'dm-leave',
    description: 'Leaves voice channel'
  },  {
    name: 'dm-music',
    description: 'Play me a song'
  },{name: 'dm-stop-music', description: 'Stop the music'}
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  const result = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log('result', result);
  console.log('commands', commands);

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}