const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../../config.json');

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
    .setName('globallinkserver')
    .setDescription('Link this server for global bans (only owner)')
    .addStringOption(option => option.setName('guildid').setDescription('Guild ID to link').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: 'Only the server owner can use this command.', ephemeral: true });
    }

    const guildId = interaction.options.getString('guildid');
    const linkedGuilds = loadJsonSafe('./Guild_Linked.json', []);

    if (linkedGuilds.includes(guildId)) {
      return interaction.reply({ content: 'This guild is already linked.', ephemeral: true });
    }

    linkedGuilds.push(guildId);
    fs.writeFileSync('./Guild_Linked.json', JSON.stringify(linkedGuilds, null, 2));
    await interaction.reply({ content: `✅ Guild \`${guildId}\` has been linked.`, ephemeral: true });

    const logChannel = interaction.client.channels.cache.get(config.logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔗 Guild Linked')
        .setColor('Green')
        .addFields(
          { name: 'Linked Guild ID', value: `\`${guildId}\``, inline: false },
          { name: 'Linked By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
        )
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] }).catch(console.error);
    }
  },
};