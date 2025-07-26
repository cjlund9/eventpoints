const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-add')
    .setDescription('Add a new item to the shop (Event Coordinator only)')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the item')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('cost')
        .setDescription('Cost in points')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of the item')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to give when purchased (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('custom_reward')
        .setDescription('Custom reward description (optional)')
        .setRequired(false)),
  
  async execute(interaction) {
    // Check if user has event coordinator role
    if (!interaction.client.eventPoints.hasEventCoordinatorRole(interaction.member)) {
      await interaction.reply({ 
        content: '❌ You need the Event Coordinator role to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const cost = interaction.options.getInteger('cost');
    const role = interaction.options.getRole('role');
    const customReward = interaction.options.getString('custom_reward');
    
    try {
      const itemId = await interaction.client.shop.addItem(
        name,
        description,
        cost,
        role ? role.id : null,
        customReward
      );
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Shop Item Added!')
        .setDescription(`Successfully added **${name}** to the shop!`)
        .addFields(
          { name: 'Item ID', value: `${itemId}`, inline: true },
          { name: 'Name', value: name, inline: true },
          { name: 'Cost', value: `${cost} points`, inline: true }
        )
        .setTimestamp();
      
      if (description) {
        embed.addFields({ name: 'Description', value: description, inline: false });
      }
      
      if (role) {
        embed.addFields({ name: 'Role Reward', value: role.name, inline: true });
      }
      
      if (customReward) {
        embed.addFields({ name: 'Custom Reward', value: customReward, inline: false });
      }
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in shop-add command:', error);
      await interaction.reply({ 
        content: 'There was an error adding the shop item!', 
        ephemeral: true 
      });
    }
  },
}; 