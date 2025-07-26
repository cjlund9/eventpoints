const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('Check your or another user\'s event points')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check points for (optional)')
        .setRequired(false)),
  
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
      // Ensure user exists in database
      await interaction.client.eventPoints.getUser(targetUser.id, targetUser.username);
      const points = await interaction.client.eventPoints.getPoints(targetUser.id);
      const stats = await interaction.client.eventPoints.getUserStats(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🏆 Event Points')
        .setDescription(`${targetUser.username}'s event points`)
        .addFields(
          { name: 'Current Points', value: `${points.toLocaleString()}`, inline: true },
          { name: 'Total Earned', value: `${stats.total_earned.toLocaleString()}`, inline: true },
          { name: 'Total Activities', value: `${stats.total_activities}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in points command:', error);
      await interaction.reply({ 
        content: 'There was an error checking the points!', 
        ephemeral: true 
      });
    }
  },
}; 