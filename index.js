require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`🟢 Bot is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  try {
    // ✅ Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }

    // ✅ Handle buttons
    if (interaction.isButton()) {
      console.log(`🟢 Button clicked: ${interaction.customId}`);

      const [action] = interaction.customId.split('_');

      // Route approve/deny buttons to requestrole handler
      if (['approve', 'deny'].includes(action)) {
        const requestRoleCmd = client.commands.get('requestrole');
        if (requestRoleCmd && requestRoleCmd.handleButton) {
          await requestRoleCmd.handleButton(interaction, client);
        }
      }

      // === VERIFY BUTTON HANDLER ADDED BELOW ===
      if (interaction.customId === 'verify_button') {
        const config = require(path.join(process.cwd(), 'config.json'));
        const roleId = config.VerifyRoleID;
        const member = interaction.member;

        if (!roleId) {
          return interaction.reply({ content: '⚠️ Verify role is not configured.', ephemeral: true });
        }

        if (member.roles.cache.has(roleId)) {
          return interaction.reply({ content: '✅ You are already verified!', ephemeral: true });
        }

        try {
          await member.roles.add(roleId);
          await interaction.reply({ content: '🎉 You have been verified and given access!', ephemeral: true });
        } catch (error) {
          console.error('Error assigning verify role:', error);
          await interaction.reply({ content: '❌ Failed to assign the verify role. Please contact an admin.', ephemeral: true });
        }
      }
      // === END VERIFY BUTTON HANDLER ===
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '❌ Something went wrong.', flags: 64 });
      } catch {
        // Ignore errors on error response
      }
    }
  }
});

client.login(process.env.TOKEN);