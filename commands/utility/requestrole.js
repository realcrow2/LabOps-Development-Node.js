const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('requestrole')
    .setDescription('Request a role to be added to a user (requires approver)')
    .addRoleOption(option => option.setName('role').setDescription('The role you are requesting').setRequired(true))
    .addUserOption(option => option.setName('approvedby').setDescription('The person who should approve this request').setRequired(true))
    .addStringOption(option => option.setName('note').setDescription('Additional note for the request').setRequired(false)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const approver = interaction.options.getUser('approvedby');
    const note = interaction.options.getString('note') || 'No additional note provided';
    const requester = interaction.user;

    const approveChannel = interaction.guild.channels.cache.get(config.RoleRequestApproveChannel);
    if (!approveChannel) {
      return interaction.reply({ content: '❌ The approve channel is not configured or cannot be found.', flags: 64 });
    }

    // Embed for request
    const embed = new EmbedBuilder()
      .setTitle('📜 Role Request')
      .setColor('Purple')
      .addFields(
        { name: 'Requester', value: `${requester}` },
        { name: 'Approved By', value: `${approver}` },
        { name: 'Role', value: `${role} (ID: ${role.id})` },
        { name: 'Time', value: new Date().toLocaleString() },
        { name: 'Note', value: note }
      )
      .setFooter({ text: 'Use the buttons below to approve or deny this request.' });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_${role.id}_${requester.id}`)
          .setLabel('Approve Role Request')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`deny_${role.id}_${requester.id}`)
          .setLabel('Deny Role Request')
          .setStyle(ButtonStyle.Danger),
      );

    // Send request in approval channel
    const requestMessage = await approveChannel.send({
      content: `${approver}`, // Ping approver outside embed
      embeds: [embed],
      components: [buttons]
    });

    await interaction.reply({ content: `✅ Role request sent to ${approveChannel}.`, flags: 64 });

    // Button collector
    const collector = requestMessage.createMessageComponentCollector({ time: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    collector.on('collect', async btnInt => {
      const approverRoleId = config.RoleRequestApprover;
      const member = await btnInt.guild.members.fetch(btnInt.user.id);

      // Role check
      if (!member.roles.cache.has(approverRoleId)) {
        return btnInt.reply({ content: '❌ You are not authorized to approve/deny role requests.', flags: 64 });
      }

      const [action, roleId, requesterId] = btnInt.customId.split('_');
      const targetMember = await btnInt.guild.members.fetch(requesterId).catch(() => null);
      if (!targetMember) {
        return btnInt.reply({ content: '❌ The requester is no longer in the server.', flags: 64 });
      }

      const requestedRole = btnInt.guild.roles.cache.get(roleId);
      if (!requestedRole) {
        return btnInt.reply({ content: '❌ The requested role no longer exists.', flags: 64 });
      }

      if (requestedRole.position >= member.roles.highest.position) {
        return btnInt.reply({ content: '❌ You cannot approve a role equal or higher than your highest role.', flags: 64 });
      }

      // Acknowledge interaction to prevent crashes
      await btnInt.deferUpdate();

      if (action === 'approve') {
        try {
          await targetMember.roles.add(requestedRole);
        } catch (err) {
          return btnInt.followUp({ content: `❌ Failed to add role: ${err.message}`, flags: 64 });
        }

        const updatedButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('approved')
              .setLabel(`Approved By: ${btnInt.user.username}`)
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('deny')
              .setLabel('Deny Role Request')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true),
          );

        await requestMessage.edit({ components: [updatedButtons] });

        // Log approval
        const logChannel = btnInt.guild.channels.cache.get(config.RoleRequestLogChannel);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('✅ Role Request Approved')
            .setColor('Green')
            .addFields(
              { name: 'Requester', value: `${targetMember}` },
              { name: 'Approved By', value: `${btnInt.user}` },
              { name: 'Role', value: `${requestedRole.name} (ID: ${requestedRole.id})` },
              { name: 'Time', value: new Date().toLocaleString() },
              { name: 'Note', value: note }
            );
          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      if (action === 'deny') {
        const updatedButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('approve')
              .setLabel('Approve Role Request')
              .setStyle(ButtonStyle.Success)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('denied')
              .setLabel(`Denied By: ${btnInt.user.username}`)
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true),
          );

        await requestMessage.edit({ components: [updatedButtons] });

        // Log denial
        const logChannel = btnInt.guild.channels.cache.get(config.RoleRequestLogChannel);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('❌ Role Request Denied')
            .setColor('Red')
            .addFields(
              { name: 'Requester', value: `${targetMember}` },
              { name: 'Denied By', value: `${btnInt.user}` },
              { name: 'Role', value: `${requestedRole.name} (ID: ${requestedRole.id})` },
              { name: 'Time', value: new Date().toLocaleString() },
              { name: 'Note', value: note }
            );
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    });
  },
};