const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const infractionsPath = path.join(process.cwd(), 'infractions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infractionsclear')
    .setDescription('Clear all infractions for a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User whose infractions you want to clear')
        .setRequired(true)),
  
  async execute(interaction) {
    // Permission check: only allow users with 'MuteRoleID' or add your own permission logic
    const config = require(path.join(process.cwd(), 'config.json'));
    if (!interaction.member.roles.cache.has(config.MuteRoleID)) {
      return interaction.reply({ content: '❌ You do not have permission to clear infractions.', ephemeral: true });
    }

    const target = interaction.options.getUser('target');
    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    // Load infractions data
    let infractionsData = { userInfractions: {} };
    if (fs.existsSync(infractionsPath)) {
      infractionsData = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));
    }

    if (!infractionsData.userInfractions || !infractionsData.userInfractions[target.id] || infractionsData.userInfractions[target.id].length === 0) {
      return interaction.reply({ content: `ℹ️ No infractions found for ${target.tag}.`, ephemeral: true });
    }

    // Clear all infractions for this user
    infractionsData.userInfractions[target.id] = [];

    // Save changes
    fs.writeFileSync(infractionsPath, JSON.stringify(infractionsData, null, 2));

    return interaction.reply({ content: `✅ All infractions for ${target.tag} have been cleared.`, ephemeral: true });
  },
};