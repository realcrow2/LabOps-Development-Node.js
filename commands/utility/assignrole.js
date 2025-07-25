const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assignrole')
    .setDescription('Assign a role to a user.')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to assign the role to').setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role').setDescription('The role to assign').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const approverRoleId = config.AssignRolePermsRoleID;
    const logChannelId = config.AssignRoleLogChannel;

    // Check if user has approver role
    if (!interaction.member.roles.cache.has(approverRoleId)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(user.id);

    // Permission hierarchy check
    if (role.position >= interaction.member.roles.highest.position) {
      return interaction.reply({ content: '❌ You cannot assign a role equal or higher than your highest role.', ephemeral: true });
    }

    await member.roles.add(role).catch(err => {
      console.error(err);
      return interaction.reply({ content: '❌ Failed to assign the role.', ephemeral: true });
    });

    await interaction.reply({ content: `✅ Assigned **${role.name}** to ${user.tag}.`, ephemeral: true });

    // Log to the channel
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Role Assigned')
        .setColor('Green')
        .addFields(
          { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: false },
          { name: 'Role', value: `${role.name} (${role.id})`, inline: false },
          { name: 'Assigned By', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] }).catch(console.error);
    }
  }
};