const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('entry-fee')
    .setDescription('Pay entry fee for events')
    .addStringOption(option =>
      option.setName('event')
        .setDescription('The event to pay entry fee for')
        .setRequired(true)
        .addChoices(
          { name: 'Bingo Entry (5 points)', value: 'bingo' },
          { name: 'Battleship Entry (5 points)', value: 'battleship' },
          { name: 'CvC Entry (20 points)', value: 'cvc' }
        )),
  
  async execute(interaction) {
    const eventType = interaction.options.getString('event');
    
    // Entry fee costs and role IDs
    const entryFees = {
      'bingo': {
        cost: 5,
        roleId: process.env.ENTRY_BINGO_ROLE_ID,
        name: 'Bingo Entry',
        description: 'Entry fee for Bingo event'
      },
      'battleship': {
        cost: 5,
        roleId: process.env.ENTRY_BATTLESHIP_ROLE_ID,
        name: 'Battleship Entry',
        description: 'Entry fee for Battleship event'
      },
      'cvc': {
        cost: 20,
        roleId: process.env.ENTRY_CVC_ROLE_ID,
        name: 'CvC Entry',
        description: 'Entry fee for CvC event'
      }
    };
    
    const event = entryFees[eventType];
    
    if (!event.roleId) {
      await interaction.reply({ 
        content: `❌ Entry fee for ${event.name} is not configured. Please contact an administrator.`, 
        ephemeral: true 
      });
      return;
    }
    
    try {
      // Check if user already has the role
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.roles.cache.has(event.roleId)) {
        await interaction.reply({ 
          content: `❌ You already have the ${event.name} role!`, 
          ephemeral: true 
        });
        return;
      }
      
      // Check if user can afford the entry fee
      const canAfford = await interaction.client.shop.canAfford(interaction.user.id, event.cost);
      
      if (!canAfford) {
        const userPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
        await interaction.reply({ 
          content: `❌ You don't have enough points! You have ${userPoints} points, but the entry fee costs ${event.cost} points.`, 
          ephemeral: true 
        });
        return;
      }
      
      // Deduct points and add role
      await interaction.client.eventPoints.removePoints(
        interaction.user.id, 
        event.cost, 
        event.description,
        interaction.user.id
      );
      
      await member.roles.add(event.roleId);
      
      const newPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎫 Entry Fee Paid!')
        .setDescription(`You've successfully paid the entry fee for **${event.name}**!`)
        .addFields(
          { name: 'Event', value: event.name, inline: true },
          { name: 'Entry Fee', value: `${event.cost} points`, inline: true },
          { name: 'Remaining Points', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Role Added', value: `<@&${event.roleId}>`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'You can now participate in the event!' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in entry-fee command:', error);
      await interaction.reply({ 
        content: 'There was an error processing your entry fee!', 
        ephemeral: true 
      });
    }
  },
}; 