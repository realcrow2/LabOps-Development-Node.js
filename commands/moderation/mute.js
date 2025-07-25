const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require(path.join(process.cwd(), 'config.json'));

const infractionsPath = path.join(process.cwd(), 'infractions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout (mute) a member for a specified duration')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Member to mute')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Duration of timeout in minutes (1-43200)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for timeout')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.MuteRoleID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const target = interaction.options.getMember('target');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: '❌ I cannot timeout this member.', ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: '❌ You cannot mute yourself.', ephemeral: true });
    if (minutes < 1 || minutes > 43200) {
      return interaction.reply({ content: '❌ Duration must be between 1 and 43200 minutes.', ephemeral: true });
    }

    try {
      const durationMs = minutes * 60 * 1000;
      await target.timeout(durationMs, reason);

      // ✅ Create embed
      const embed = new EmbedBuilder()
        .setTitle('🔇 Member Timed Out')
        .setColor(0xffa500)
        .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 Member', value: `${target.user.tag} (${target.id})`, inline: false },
          { name: '👮 By', value: `${interaction.user.tag}`, inline: false },
          { name: '⏳ Duration', value: `${minutes} minutes`, inline: false },
          { name: '📝 Reason', value: reason, inline: false }
        )
        .setFooter({ text: `User ID: ${target.id}` })
        .setTimestamp();

      // ✅ Ephemeral confirmation
      await interaction.reply({ content: `✅ ${target.user.tag} has been muted for **${minutes} minutes**.`, ephemeral: true });

      // ✅ DM the muted user
      try {
        await target.send({
          content: `You have been muted in **${interaction.guild.name}**.`,
          embeds: [embed]
        });
      } catch {
        console.warn(`⚠️ Could not DM ${target.user.tag}.`);
      }

      // ✅ Log to staff channel
      const logChannel = interaction.guild.channels.cache.get(config.MuteLogsChannel);
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }

      // ✅ Save Infraction Globally
      const infractionsData = JSON.parse(fs.readFileSync(infractionsPath, 'utf8'));

      if (!infractionsData.userInfractions) infractionsData.userInfractions = {};
      if (!infractionsData.userInfractions[target.id]) {
        infractionsData.userInfractions[target.id] = [];
      }

      infractionsData.userInfractions[target.id].push({
        type: 'Mute',
        guildId: interaction.guild.id,
        moderator: interaction.user.tag,
        duration: `${minutes} minutes`,
        reason: reason,
        timestamp: new Date().toISOString()
      });

      fs.writeFileSync(infractionsPath, JSON.stringify(infractionsData, null, 2));

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Failed to mute the member.', ephemeral: true });
    }
  }
};