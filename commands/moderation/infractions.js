const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(process.cwd(), 'infractions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('View all mute infractions for a user (global)')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to check')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    // Load data
    const infractionsData = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
    const userHistory = infractionsData.userInfractions[target.id];

    if (!userHistory || userHistory.length === 0) {
      return interaction.reply({ content: `✅ No infractions found for ${target.tag}.`, ephemeral: true });
    }

    // Create embed with all infractions
    const embed = new EmbedBuilder()
      .setTitle(`📜 Infractions for ${target.tag}`)
      .setColor(0xffa500)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `User ID: ${target.id}` })
      .setTimestamp();

    let description = '';
    userHistory.forEach((entry, index) => {
      description += `**${index + 1}.** Guild: \`${entry.guildId}\`\n`;
      description += `👮 Moderator: **${entry.moderator}**\n`;
      description += `⏳ Duration: **${entry.duration}**\n`;
      description += `📝 Reason: ${entry.reason}\n`;
      description += `📅 Date: <t:${Math.floor(new Date(entry.timestamp).getTime() / 1000)}:f>\n\n`;
    });

    embed.setDescription(description.slice(0, 4000)); // Discord limit safety

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};