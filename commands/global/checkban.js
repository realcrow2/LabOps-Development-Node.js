const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

function loadJsonSafe(filePath, fallbackValue) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch {
    return fallbackValue;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkban')
    .setDescription('Check if a user is globally banned')
    .addUserOption(option => option.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const bans = loadJsonSafe('./Ban_File.json', []);

    const isBanned = bans.includes(user.id);
    const embed = new EmbedBuilder()
      .setTitle('Global Ban Check')
      .setColor(isBanned ? 'Red' : 'Green')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Banned Status', value: isBanned ? '❌ Globally Banned' : '✅ Not Globally Banned' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};