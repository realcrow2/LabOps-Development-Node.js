const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unassignrole')
    .setDescription('Remove a role from a user.')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to remove the role from').setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role').setDescription('The role to remove').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const approverRoleId = config.AssignRolePermsRoleID;
    const logChannelId = config.AssignRoleLogChannel;

    if (!interaction.member.roles.cache.has(approverRoleId)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(user.id);

    if (role.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: '❌ You cannot remove a role equal or higher than your highest role.', ephemeral: true });
    }

    await member.roles.remove(role).catch(err => {
      console.error(err);
      return interaction.reply({ content: '❌ Failed to remove the role.', ephemeral: true });
    });

    await interaction.reply({ content: `✅ Removed **${role.name}** from ${user.tag}.`, ephemeral: true });

    // Log to the same channel
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Role Removed')
        .setColor('Red')
        .addFields(
          { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: false },
          { name: 'Role', value: `${role.name} (${role.id})`, inline: false },
          { name: 'Removed By', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(console.error);
    }
  }
};