const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-buyin-manage')
    .setDescription('Manage event buy-ins (Event Coordinator only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-role')
        .setDescription('Remove event participation role from a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('event')
            .setDescription('The event to remove role for')
            .setRequired(true)
            .addChoices(
              { name: 'Skill of the Week', value: 'skill_week' },
              { name: 'Clue of the Month', value: 'clue_month' },
              { name: 'Boss of the Week', value: 'boss_week' },
              { name: 'General Bingo', value: 'bingo' },
              { name: 'Battleship', value: 'battleship' },
              { name: 'Mania', value: 'mania' },
              { name: 'Bounty', value: 'bounty' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list-participants')
        .setDescription('List all participants for an event')
        .addStringOption(option =>
          option.setName('event')
            .setDescription('The event to list participants for')
            .setRequired(true)
            .addChoices(
              { name: 'Skill of the Week', value: 'skill_week' },
              { name: 'Clue of the Month', value: 'clue_month' },
              { name: 'Boss of the Week', value: 'boss_week' },
              { name: 'General Bingo', value: 'bingo' },
              { name: 'Battleship', value: 'battleship' },
              { name: 'Mania', value: 'mania' },
              { name: 'Bounty', value: 'bounty' }
            ))),
  
  async execute(interaction) {
    // Check if user has event coordinator role
    if (!interaction.client.eventPoints.hasEventCoordinatorRole(interaction.member)) {
      await interaction.reply({ 
        content: '❌ You need the Event Coordinator role to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const eventType = interaction.options.getString('event');
    
    // Event role IDs mapping
    const eventRoles = {
      'skill_week': {
        roleId: process.env.EVENT_SKILL_WEEK_ROLE_ID,
        name: 'Skill of the Week'
      },
      'clue_month': {
        roleId: process.env.EVENT_CLUE_MONTH_ROLE_ID,
        name: 'Clue of the Month'
      },
      'boss_week': {
        roleId: process.env.EVENT_BOSS_WEEK_ROLE_ID,
        name: 'Boss of the Week'
      },
      'bingo': {
        roleId: process.env.EVENT_BINGO_ROLE_ID,
        name: 'General Bingo'
      },
      'battleship': {
        roleId: process.env.EVENT_BATTLESHIP_ROLE_ID,
        name: 'Battleship'
      },
      'mania': {
        roleId: process.env.EVENT_MANIA_ROLE_ID,
        name: 'Mania'
      },
      'bounty': {
        roleId: process.env.EVENT_BOUNTY_ROLE_ID,
        name: 'Bounty'
      }
    };
    
    const event = eventRoles[eventType];
    
    if (!event.roleId) {
      await interaction.reply({ 
        content: `❌ Event role for ${event.name} is not configured. Please contact an administrator.`, 
        ephemeral: true 
      });
      return;
    }
    
    try {
      if (subcommand === 'remove-role') {
        const targetUser = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        if (!member.roles.cache.has(event.roleId)) {
          await interaction.reply({ 
            content: `❌ ${targetUser.username} doesn't have the ${event.name} participant role!`, 
            ephemeral: true 
          });
          return;
        }
        
        await member.roles.remove(event.roleId);
        
        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🗑️ Event Role Removed')
          .setDescription(`Successfully removed ${targetUser.username} from **${event.name}** participants.`)
          .addFields(
            { name: 'User', value: targetUser.username, inline: true },
            { name: 'Event', value: event.name, inline: true },
            { name: 'Role Removed', value: `<@&${event.roleId}>`, inline: true }
          )
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `Removed by ${interaction.user.username}` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
      } else if (subcommand === 'list-participants') {
        const role = await interaction.guild.roles.fetch(event.roleId);
        
        if (!role) {
          await interaction.reply({ 
            content: `❌ Role for ${event.name} not found!`, 
            ephemeral: true 
          });
          return;
        }
        
        const participants = role.members.map(member => member.user.username);
        
        if (participants.length === 0) {
          await interaction.reply({ 
            content: `No participants found for **${event.name}**.`, 
            ephemeral: true 
          });
          return;
        }
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle(`📋 ${event.name} Participants`)
          .setDescription(`**${participants.length}** participants`)
          .addFields(
            { name: 'Participants', value: participants.join('\n'), inline: false }
          )
          .setFooter({ text: `Requested by ${interaction.user.username}` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Error in event-buyin-manage command:', error);
      await interaction.reply({ 
        content: 'There was an error processing your request!', 
        ephemeral: true 
      });
    }
  },
}; 