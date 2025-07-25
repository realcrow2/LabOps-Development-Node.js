const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

function loadJsonSafe(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallbackValue;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listlinkedguilds')
    .setDescription('List all linked servers for global bans'),

  async execute(interaction) {
    const linkedGuilds = loadJsonSafe('./Guild_Linked.json', []);

    if (linkedGuilds.length === 0) {
      return interaction.reply({ content: '⚠️ No servers are currently linked for global bans.', ephemeral: true });
    }

    // Build list with guild names if possible
    const guildInfoList = linkedGuilds.map((id, index) => {
      const guild = interaction.client.guilds.cache.get(id);
      return `${index + 1}. **${guild ? guild.name : 'Unknown Guild'}** (\`${id}\`)`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🌐 Linked Servers')
      .setColor('#00BFFF') // Bright blue
      .setDescription(guildInfoList.join('\n'))
      .setFooter({ text: `Total Linked Servers: ${linkedGuilds.length}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};