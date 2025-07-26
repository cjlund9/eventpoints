const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-buyin')
    .setDescription('Purchase event participation role')
    .addStringOption(option =>
      option.setName('event')
        .setDescription('The event to buy in for')
        .setRequired(true)
        .addChoices(
          { name: 'Skill of the Week', value: 'skill_week' },
          { name: 'Clue of the Month', value: 'clue_month' },
          { name: 'Boss of the Week', value: 'boss_week' },
          { name: 'General Bingo', value: 'bingo' },
          { name: 'Battleship', value: 'battleship' },
          { name: 'Mania', value: 'mania' },
          { name: 'Bounty', value: 'bounty' }
        )),
  
  async execute(interaction) {
    const eventType = interaction.options.getString('event');
    
    // Event buy-in costs and role IDs (configure these in your .env file)
    const eventBuyIns = {
      'skill_week': {
        cost: parseInt(process.env.EVENT_SKILL_WEEK_BUYIN) || 50,
        roleId: process.env.EVENT_SKILL_WEEK_ROLE_ID,
        name: 'Skill of the Week'
      },
      'clue_month': {
        cost: parseInt(process.env.EVENT_CLUE_MONTH_BUYIN) || 50,
        roleId: process.env.EVENT_CLUE_MONTH_ROLE_ID,
        name: 'Clue of the Month'
      },
      'boss_week': {
        cost: parseInt(process.env.EVENT_BOSS_WEEK_BUYIN) || 50,
        roleId: process.env.EVENT_BOSS_WEEK_ROLE_ID,
        name: 'Boss of the Week'
      },
      'bingo': {
        cost: parseInt(process.env.EVENT_BINGO_BUYIN) || 50,
        roleId: process.env.EVENT_BINGO_ROLE_ID,
        name: 'General Bingo'
      },
      'battleship': {
        cost: parseInt(process.env.EVENT_BATTLESHIP_BUYIN) || 50,
        roleId: process.env.EVENT_BATTLESHIP_ROLE_ID,
        name: 'Battleship'
      },
      'mania': {
        cost: parseInt(process.env.EVENT_MANIA_BUYIN) || 50,
        roleId: process.env.EVENT_MANIA_ROLE_ID,
        name: 'Mania'
      },
      'bounty': {
        cost: parseInt(process.env.EVENT_BOUNTY_BUYIN) || 50,
        roleId: process.env.EVENT_BOUNTY_ROLE_ID,
        name: 'Bounty'
      }
    };
    
    const event = eventBuyIns[eventType];
    
    if (!event.roleId) {
      await interaction.reply({ 
        content: `❌ Event buy-in for ${event.name} is not configured. Please contact an administrator.`, 
        ephemeral: true 
      });
      return;
    }
    
    try {
      // Check if user already has the role
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.roles.cache.has(event.roleId)) {
        await interaction.reply({ 
          content: `❌ You already have the ${event.name} participant role!`, 
          ephemeral: true 
        });
        return;
      }
      
      // Check if user can afford the buy-in
      const canAfford = await interaction.client.shop.canAfford(interaction.user.id, event.cost);
      
      if (!canAfford) {
        const userPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
        await interaction.reply({ 
          content: `❌ You don't have enough points! You have ${userPoints} points, but the buy-in costs ${event.cost} points.`, 
          ephemeral: true 
        });
        return;
      }
      
      // Deduct points and add role
      await interaction.client.eventPoints.removePoints(
        interaction.user.id, 
        event.cost, 
        `${event.name} Event Buy-in`,
        interaction.user.id
      );
      
      await member.roles.add(event.roleId);
      
      const newPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 Event Buy-in Successful!')
        .setDescription(`You've successfully bought into **${event.name}**!`)
        .addFields(
          { name: 'Event', value: event.name, inline: true },
          { name: 'Cost', value: `${event.cost} points`, inline: true },
          { name: 'Remaining Points', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Role Added', value: `<@&${event.roleId}>`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'You can now participate in the event!' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in event-buyin command:', error);
      await interaction.reply({ 
        content: 'There was an error processing your event buy-in!', 
        ephemeral: true 
      });
    }
  },
}; 