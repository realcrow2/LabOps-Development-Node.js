const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fs = require('fs');
const config = require('../../config.json');

function loadJsonSafe(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallbackValue;
  }
}

function userHasGlobalRole(member, allowedRoles) {
  return member.roles.cache.some(role => allowedRoles.includes(role.id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('globalban')
    .setDescription('Globally ban a user')
    .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(false)),

  async execute(interaction) {
    const globalRoles = loadJsonSafe('./GlobalRoles.json', {});
    const allowedRoles = globalRoles[interaction.guildId] || [];
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!userHasGlobalRole(member, allowedRoles)) {
      return interaction.reply({ content: '❌ You are not authorized to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('confirm').setLabel('✅ Confirm').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger),
      );

    await interaction.reply({
      content: `Are you sure you want to **globally ban** ${user.tag}?`,
      components: [buttons],
      ephemeral: true,
    });

    const filter = i => ['confirm', 'cancel'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async i => {
      if (i.customId === 'cancel') {
        return i.update({ content: '❌ Global ban cancelled.', components: [] });
      }

      if (i.customId === 'confirm') {
        await i.deferUpdate();

        const linkedGuilds = loadJsonSafe('./Guild_Linked.json', []);
        const bans = loadJsonSafe('./Ban_File.json', []);

        if (bans.includes(user.id)) {
          return interaction.editReply({ content: '⚠️ User is already globally banned.', components: [] });
        }

        bans.push(user.id);
        fs.writeFileSync('./Ban_File.json', JSON.stringify(bans, null, 2));

        const failedGuilds = [];
        for (const guildId of linkedGuilds) {
          const guild = interaction.client.guilds.cache.get(guildId);
          if (!guild) continue;

          try {
            const member = await guild.members.fetch(user.id).catch(() => null);
            if (member) {
              await member.ban({ reason: `Global ban: ${reason}` });
            } else {
              await guild.members.ban(user.id, { reason: `Global ban: ${reason}` });
            }
          } catch {
            failedGuilds.push(guild.name || guildId);
          }
        }

        // ✅ Bright Neon Red Embed
        const embed = new EmbedBuilder()
          .setTitle('🚫 GLOBAL BAN EXECUTED')
          .setColor('#FF073A') // Bright Neon Red
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setDescription(`**A global ban has been processed successfully.**`)
          .addFields(
            { name: '👤 **User Banned**', value: `<@${user.id}> (${user.tag})`, inline: false },
            { name: '🛠️ **Banned By**', value: `${interaction.user} (${interaction.user.tag})`, inline: false },
            { name: '📜 **Reason**', value: `\`\`\`${reason}\`\`\``, inline: false },
            { name: '❗ **Failed Guilds**', value: failedGuilds.length ? failedGuilds.join(', ') : 'None', inline: false },
            { name: '📅 **Time**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setFooter({ text: 'Global Ban System | Action Logged', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.editReply({ content: null, embeds: [embed], components: [] });

        const logChannel = interaction.client.channels.cache.get(config.logChannelId);
        if (logChannel) {
          try {
            const actionButtons = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder().setCustomId(`approve_${user.id}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`revoke_${user.id}`).setLabel('❌ Revoke').setStyle(ButtonStyle.Danger),
              );

            const logMessage = await logChannel.send({ embeds: [embed], components: [actionButtons] });

            // Start thread for evidence
            const thread = await logMessage.startThread({
              name: `Evidence: ${user.tag}`,
              autoArchiveDuration: 1440,
            });

            await thread.send({
              content:
`📌 **Provide the following evidence for this global ban:**
• Screenshots of misconduct  
• Video clips if available  
• Chat logs or transcripts  
• Any additional context`
            });

            const buttonCollector = logMessage.createMessageComponentCollector({ time: 7 * 24 * 60 * 60 * 1000 });

            buttonCollector.on('collect', async btnInt => {
              if (!btnInt.member.permissions.has('ManageGuild')) {
                return btnInt.reply({ content: '❌ You do not have permission to perform this action.', ephemeral: true });
              }

              if (btnInt.customId.startsWith('approve_')) {
                const approver = btnInt.user;
                const newButtons = new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId(`approved_${user.id}`)
                      .setLabel(`Approved By: ${approver.username}`)
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId(`revoke_${user.id}`)
                      .setLabel('❌ Revoke')
                      .setStyle(ButtonStyle.Danger)
                  );
                await btnInt.update({ components: [newButtons] });
              }

              if (btnInt.customId.startsWith('revoke_')) {
                const revoker = btnInt.user;
                const userId = btnInt.customId.split('_')[1];
                const bans = loadJsonSafe('./Ban_File.json', []);
                if (!bans.includes(userId)) {
                  return btnInt.reply({ content: 'User is not globally banned.', ephemeral: true });
                }

                const updatedBans = bans.filter(id => id !== userId);
                fs.writeFileSync('./Ban_File.json', JSON.stringify(updatedBans, null, 2));

                const linkedGuilds = loadJsonSafe('./Guild_Linked.json', []);
                const failedUnbans = [];
                for (const guildId of linkedGuilds) {
                  const guild = await interaction.client.guilds.fetch(guildId).catch(() => null);
                  if (!guild) continue;

                  try {
                    await guild.bans.remove(userId, 'Global unban (revoke)');
                  } catch (e) {
                    if (!e.message.includes('Unknown Ban')) {
                      failedUnbans.push(guild.name || guildId);
                    }
                  }
                }

                const newButtons = new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId(`revoked_${userId}`)
                      .setLabel(`Revoked By: ${revoker.username}`)
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true)
                  );

                await btnInt.update({ components: [newButtons] });
                await btnInt.followUp({ content: '✅ Global ban revoked and user unbanned from all servers.', ephemeral: true });
              }
            });
          } catch (err) {
            console.error('Failed to send log message or handle buttons:', err);
          }
        }
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({ content: '⌛ Confirmation timed out. Global ban cancelled.', components: [] });
        } catch {}
      }
    });
  },
};