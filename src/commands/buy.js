const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase an item from the shop')
    .addIntegerOption(option =>
      option.setName('item_id')
        .setDescription('The ID of the item to purchase')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Your choice for SOTW/BOTW/COTW (required for those items)')
        .setRequired(false)),
  
  async execute(interaction) {
    const itemId = interaction.options.getInteger('item_id');
    const choice = interaction.options.getString('choice');
    
    try {
      // Get the item
      const item = await interaction.client.shop.getItem(itemId);
      
      if (!item) {
        await interaction.reply({ 
          content: 'Item not found!', 
          ephemeral: true 
        });
        return;
      }
      
      // Check if choice is required but not provided
      const choiceRequiredItems = ['Choose SOTW', 'Choose BOTW', 'Choose COTW'];
      if (choiceRequiredItems.includes(item.name) && !choice) {
        await interaction.reply({ 
          content: `❌ You must specify your choice for ${item.name}! Please use the \`choice\` option to indicate which skill/boss/clue you want.`, 
          ephemeral: true 
        });
        return;
      }
      
      // Check if user can afford it
      const canAfford = await interaction.client.shop.canAfford(interaction.user.id, item.cost);
      
      if (!canAfford) {
        const userPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
        await interaction.reply({ 
          content: `❌ You don't have enough points! You have ${userPoints} points, but this item costs ${item.cost} points.`, 
          ephemeral: true 
        });
        return;
      }
      
      // Purchase the item
      await interaction.client.shop.purchaseItem(interaction.user.id, item.id, item.name, item.cost);
      
      const newPoints = await interaction.client.eventPoints.getPoints(interaction.user.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Purchase Successful!')
        .setDescription(`You purchased **${item.name}** for ${item.cost} points!`)
        .addFields(
          { name: 'Item', value: item.name, inline: true },
          { name: 'Cost', value: `${item.cost} points`, inline: true },
          { name: 'Remaining Points', value: `${newPoints.toLocaleString()}`, inline: true }
        )
        .setTimestamp();
      
      if (item.description) {
        embed.addFields({ name: 'Description', value: item.description, inline: false });
      }
      
      // Add choice field if provided
      if (choice) {
        embed.addFields({ name: 'Your Choice', value: choice, inline: false });
      }
      
      await interaction.reply({ embeds: [embed] });
      
      // If the item has a role reward, add it to the user
      if (item.role_id) {
        try {
          const member = await interaction.guild.members.fetch(interaction.user.id);
          await member.roles.add(item.role_id);
          await interaction.followUp({ 
            content: `🎉 You've been given the **${item.name}** role!`, 
            ephemeral: true 
          });
        } catch (roleError) {
          console.error('Error adding role:', roleError);
          await interaction.followUp({ 
            content: '⚠️ Item purchased, but there was an error adding the role. Please contact an administrator.', 
            ephemeral: true 
          });
        }
      }
      
      // Send alert to event staff for SOTW/BOTW/COTW purchases
      const alertItems = ['Choose SOTW', 'Choose BOTW', 'Choose COTW'];
      if (alertItems.includes(item.name)) {
        try {
          // Get the event coordinator role ID
          const coordinatorRoleId = process.env.EVENT_COORDINATOR_ROLE_ID;
          
          if (coordinatorRoleId) {
            // Find the event coordinator role
            const coordinatorRole = await interaction.guild.roles.fetch(coordinatorRoleId);
            
            if (coordinatorRole) {
              const alertEmbed = new EmbedBuilder()
                .setColor('#ff6b35')
                .setTitle('🎯 Event Choice Purchase Alert!')
                .setDescription(`**${interaction.user.username}** has purchased **${item.name}**!`)
                .addFields(
                  { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
                  { name: 'Item', value: item.name, inline: true },
                  { name: 'Cost', value: `${item.cost} points`, inline: true },
                  { name: 'Choice', value: choice || 'Not specified', inline: true },
                  { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: 'Event Staff Alert' })
                .setTimestamp();
              
              // Try to send the alert to a designated channel or mention the role
              try {
                // Look for a channel named 'event-staff' or 'events' or similar
                const alertChannel = interaction.guild.channels.cache.find(channel => 
                  channel.name.toLowerCase().includes('event') && 
                  channel.type === 0 // Text channel
                );
                
                if (alertChannel) {
                  await alertChannel.send({ 
                    content: `<@&${coordinatorRoleId}>`,
                    embeds: [alertEmbed] 
                  });
                } else {
                  // If no event channel found, send to the same channel but mention the role
                  await interaction.followUp({ 
                    content: `<@&${coordinatorRoleId}>`,
                    embeds: [alertEmbed] 
                  });
                }
              } catch (channelError) {
                console.error('Error sending alert to channel:', channelError);
                // Fallback: send alert in the same channel
                await interaction.followUp({ 
                  content: `<@&${coordinatorRoleId}>`,
                  embeds: [alertEmbed] 
                });
              }
            }
          }
        } catch (alertError) {
          console.error('Error sending event staff alert:', alertError);
          // Don't fail the purchase if alert fails
        }
      }
      
    } catch (error) {
      console.error('Error in buy command:', error);
      await interaction.reply({ 
        content: 'There was an error processing your purchase!', 
        ephemeral: true 
      });
    }
  },
}; 