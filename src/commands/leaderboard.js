const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the event points leaderboard')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of users to show (1-25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),
  
  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    
    try {
      const leaderboard = await interaction.client.eventPoints.getLeaderboard(limit);
      
      if (leaderboard.length === 0) {
        await interaction.reply({ 
          content: 'No users found on the leaderboard!', 
          ephemeral: true 
        });
        return;
      }
      
      let description = '';
      for (let i = 0; i < leaderboard.length; i++) {
        const user = leaderboard[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        description += `${medal} **${user.username}** - ${user.points.toLocaleString()} points\n`;
      }
      
      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🏆 Event Points Leaderboard')
        .setDescription(description)
        .setFooter({ text: `Top ${leaderboard.length} users` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in leaderboard command:', error);
      await interaction.reply({ 
        content: 'There was an error fetching the leaderboard!', 
        ephemeral: true 
      });
    }
  },
}; 