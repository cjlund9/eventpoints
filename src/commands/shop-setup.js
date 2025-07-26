const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-setup')
    .setDescription('Set up default shop items (Event Coordinator only)'),
  
  async execute(interaction) {
    // Check if user has event coordinator role
    if (!interaction.client.eventPoints.hasEventCoordinatorRole(interaction.member)) {
      await interaction.reply({ 
        content: '❌ You need the Event Coordinator role to use this command!', 
        ephemeral: true 
      });
      return;
    }

    try {
      // Default shop items
      const defaultItems = [
        {
          name: 'Choose SOTW',
          description: 'Get to choose the Skill of the Week',
          cost: 50,
          roleId: null, // No role assignment - just triggers alert
          customReward: 'You can now choose the Skill of the Week'
        },
        {
          name: 'Choose BOTW',
          description: 'Get to choose the Boss of the Week',
          cost: 50,
          roleId: null, // No role assignment - just triggers alert
          customReward: 'You can now choose the Boss of the Week'
        },
        {
          name: 'Choose COTW',
          description: 'Get to choose the Clue of the Month',
          cost: 50,
          roleId: null, // No role assignment - just triggers alert
          customReward: 'You can now choose the Clue of the Month'
        },
        {
          name: 'Events Rank',
          description: 'Get the Events Rank role (in game/discord)',
          cost: 1000,
          roleId: process.env.SHOP_EVENTS_RANK_ROLE_ID,
          customReward: 'You now have the Events Rank role'
        },
        {
          name: '1 Alt Allowed',
          description: 'Allow 1 alt account (1 time purchase)',
          cost: 1000,
          roleId: process.env.SHOP_ALT_ALLOWED_ROLE_ID,
          customReward: 'You can now use 1 alt account'
        }
      ];

      let addedItems = [];
      let skippedItems = [];

      for (const item of defaultItems) {
        try {
          // Check if item already exists
          const existingItems = await interaction.client.shop.getItems();
          const exists = existingItems.some(existing => 
            existing.name.toLowerCase() === item.name.toLowerCase()
          );

          if (exists) {
            skippedItems.push(item.name);
            continue;
          }

          const itemId = await interaction.client.shop.addItem(
            item.name,
            item.description,
            item.cost,
            item.roleId,
            item.customReward
          );

          addedItems.push({
            id: itemId,
            name: item.name,
            cost: item.cost
          });
        } catch (error) {
          console.error(`Error adding item ${item.name}:`, error);
          skippedItems.push(item.name);
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🛒 Shop Setup Complete')
        .setTimestamp();

      if (addedItems.length > 0) {
        let addedDescription = '**Added Items:**\n';
        for (const item of addedItems) {
          addedDescription += `• **${item.name}** - ${item.cost} points (ID: ${item.id})\n`;
        }
        embed.addFields({ name: '✅ Successfully Added', value: addedDescription, inline: false });
      }

      if (skippedItems.length > 0) {
        let skippedDescription = '**Skipped Items (already exist):**\n';
        for (const item of skippedItems) {
          skippedDescription += `• ${item}\n`;
        }
        embed.addFields({ name: '⏭️ Skipped', value: skippedDescription, inline: false });
      }

      if (addedItems.length === 0 && skippedItems.length === 0) {
        embed.setDescription('No items were processed.');
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in shop-setup command:', error);
      await interaction.reply({ 
        content: 'There was an error setting up the shop!', 
        ephemeral: true 
      });
    }
  },
}; 