const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('node:path');
const config = require(path.join(process.cwd(), 'config.json'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Post the verification embed with button (server owner only)'),
  
  async execute(interaction) {
    // Only allow server owner
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Only the server owner can use this command.', ephemeral: true });
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle('🔐 Server Verification')
      .setDescription('Welcome! Please click the **Verify** button below to gain access to the server.')
      .setColor(0x5865F2) // Discord blurple color
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({ text: `Server: ${interaction.guild.name}` })
      .setTimestamp();

    // Create Verify button
    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('Verify')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const row = new ActionRowBuilder().addComponents(button);

    // Send the embed with button
    await interaction.reply({ embeds: [embed], components: [row] });
  }
};

// Button interaction handler must be registered in your index.js (see below)