const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-remove')
    .setDescription('Remove an item from the shop (Event Coordinator only)')
    .addIntegerOption(option =>
      option.setName('item_id')
        .setDescription('The ID of the item to remove')
        .setRequired(true)
        .setMinValue(1)),
  
  async execute(interaction) {
    // Check if user has event coordinator role
    if (!interaction.client.eventPoints.hasEventCoordinatorRole(interaction.member)) {
      await interaction.reply({ 
        content: '❌ You need the Event Coordinator role to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const itemId = interaction.options.getInteger('item_id');
    
    try {
      // Get the item first to show what's being removed
      const item = await interaction.client.shop.getItem(itemId);
      
      if (!item) {
        await interaction.reply({ 
          content: 'Item not found!', 
          ephemeral: true 
        });
        return;
      }
      
      // Remove the item
      const removed = await interaction.client.shop.deleteItem(itemId);
      
      if (!removed) {
        await interaction.reply({ 
          content: 'Failed to remove the item!', 
          ephemeral: true 
        });
        return;
      }
      
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🗑️ Shop Item Removed!')
        .setDescription(`Successfully removed **${item.name}** from the shop!`)
        .addFields(
          { name: 'Item ID', value: `${itemId}`, inline: true },
          { name: 'Name', value: item.name, inline: true },
          { name: 'Cost', value: `${item.cost} points`, inline: true }
        )
        .setTimestamp();
      
      if (item.description) {
        embed.addFields({ name: 'Description', value: item.description, inline: false });
      }
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in shop-remove command:', error);
      await interaction.reply({ 
        content: 'There was an error removing the shop item!', 
        ephemeral: true 
      });
    }
  },
}; 