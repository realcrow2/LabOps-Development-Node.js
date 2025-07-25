const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config.json');
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
    .setName('globalkick')
    .setDescription('Globally kick a user from all linked servers')
    .addUserOption(option =>
      option.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for kick').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirmkick').setLabel('Confirm').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancelkick').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `Are you sure you want to globally kick **${user.tag}**?\nReason: ${reason}`,
      components: [buttons],
      flags: 64
    });

    const filter = i => ['confirmkick', 'cancelkick'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async i => {
      if (i.customId === 'cancelkick') {
        return i.update({ content: '❌ Global kick cancelled.', components: [] });
      }

      if (i.customId === 'confirmkick') {
        await i.update({ content: '⏳ Processing global kick...', components: [] });

        const linkedGuilds = loadJsonSafe('./Guild_Linked.json', []);
        const failedGuilds = [];
        let rolesBeforeKick = [];

        for (const guildId of linkedGuilds) {
          const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
          if (!guild) continue;

          try {
            const member = await guild.members.fetch(user.id).catch(() => null);
            if (member) {
              const rolesList = member.roles.cache.filter(r => r.id !== guild.id).map(r => r.name);
              if (rolesList.length) rolesBeforeKick.push(`[${guild.name}] ${rolesList.join(', ')}`);
              await member.kick(`Global kick: ${reason}`);
            }
          } catch {
            failedGuilds.push(guild.name || guildId);
          }
        }

        const embed = new EmbedBuilder()
          .setTitle('🌐 Global Kick Executed')
          .setColor('Orange')
          .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'Kicked By', value: `${interaction.user}` },
            { name: 'Reason', value: reason },
            { name: 'Roles Before Kick', value: rolesBeforeKick.length ? rolesBeforeKick.join('\n') : 'None' },
            { name: 'Failed Guilds', value: failedGuilds.length ? failedGuilds.join(', ') : 'None' }
          )
          .setTimestamp();

        await interaction.followUp({ content: '✅ Global kick complete.', embeds: [embed], flags: 64 });

        const logChannel = interaction.client.channels.cache.get(config.KickLogChannel);
        if (logChannel) logChannel.send({ embeds: [embed] });
      }
    });
  }
};