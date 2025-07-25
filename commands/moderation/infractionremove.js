const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(process.cwd(), 'infractions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractionremove')
    .setDescription('Remove a specific infraction from a user by index')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User to remove an infraction from')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('index')
        .setDescription('Index number of the infraction to remove (starting from 1)')
        .setRequired(true)),
  
  async execute(interaction) {
    const config = require(path.join(process.cwd(), 'config.json'));
    if (!interaction.member.roles.cache.has(config.MuteRoleID)) {
      return interaction.reply({ content: '❌ You do not have permission to remove infractions.', ephemeral: true });
    }

    const target = interaction.options.getUser('target');
    const index = interaction.options.getInteger('index');

    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    // Load infractions data
    let infractionsData = { userInfractions: {} };
    if (fs.existsSync(infractionsPath)) {
      infractionsData = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
    }

    if (!infractionsData.userInfractions || !infractionsData.userInfractions[target.id]) {
      return interaction.reply({ content: `ℹ️ No infractions found for ${target.tag}.`, ephemeral: true });
    }

    const userInfractions = infractionsData.userInfractions[target.id];
    if (index < 1 || index > userInfractions.length) {
      return interaction.reply({ content: `❌ Invalid index. Please provide a number between 1 and ${userInfractions.length}.`, ephemeral: true });
    }

    // Remove the infraction at index (adjusting for 0-based array)
    const removed = userInfractions.splice(index - 1, 1)[0];

    // Save changes
    fs.writeFileSync(infractionsPath, JSON.stringify(infractionsData, null, 2));

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Infraction Removed')
      .setColor('Green')
      .setDescription(`Removed infraction #${index} for ${target.tag}.`)
      .addFields(
        { name: 'Type', value: removed.type || 'Unknown', inline: true },
        { name: 'Moderator', value: removed.moderator || 'Unknown', inline: true },
        { name: 'Reason', value: removed.reason || 'No reason', inline: false },
        { name: 'Date', value: new Date(removed.timestamp).toLocaleString() || 'Unknown', inline: false }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};