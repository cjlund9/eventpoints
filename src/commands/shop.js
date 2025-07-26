const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the event points shop'),
  
  async execute(interaction) {
    try {
      const items = await interaction.client.shop.getItems();
      
      if (items.length === 0) {
        await interaction.reply({ 
          content: 'The shop is currently empty!', 
          ephemeral: true 
        });
        return;
      }
      
      let description = '';
      for (const item of items) {
        description += `**${item.name}** - ${item.cost} points\n`;
        if (item.description) {
          description += `*${item.description}*\n`;
        }
        description += '\n';
      }
      
      const embed = new EmbedBuilder()
        .setColor('#ff6b6b')
        .setTitle('🛒 Event Points Shop')
        .setDescription(description)
        .setFooter({ text: 'Use /buy <item_id> to purchase an item' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in shop command:', error);
      await interaction.reply({ 
        content: 'There was an error loading the shop!', 
        ephemeral: true 
      });
    }
  },
}; 