const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-combat')
    .setDescription('Award points for combat achievement tier (Event Coordinator only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to award points to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Combat achievement tier')
        .setRequired(true)
        .addChoices(
          { name: 'Easy (10 points)', value: 'easy' },
          { name: 'Medium (25 points)', value: 'medium' },
          { name: 'Hard (50 points)', value: 'hard' },
          { name: 'Elite (75 points)', value: 'elite' },
          { name: 'Master (100 points)', value: 'master' },
          { name: 'Grandmaster (200 points)', value: 'grandmaster' }
        )),
  
  async execute(interaction) {
    // Check if user has event coordinator role
    if (!interaction.client.eventPoints.hasEventCoordinatorRole(interaction.member)) {
      await interaction.reply({ 
        content: '❌ You need the Event Coordinator role to use this command!', 
        ephemeral: true 
      });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    const tier = interaction.options.getString('tier');
    
    try {
      const pointsAwarded = await interaction.client.eventPoints.awardCombatAchievement(
        targetUser.id,
        targetUser.username,
        tier,
        interaction.user.id
      );
      
      const newPoints = await interaction.client.eventPoints.getPoints(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#ff6b35')
        .setTitle('⚔️ Combat Achievement Points Awarded!')
        .setDescription(`${targetUser.username} received **${pointsAwarded} points** for Combat Achievement ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`)
        .addFields(
          { name: 'Points Awarded', value: `+${pointsAwarded}`, inline: true },
          { name: 'New Total', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Achievement', value: `Combat Achievement ${tier.charAt(0).toUpperCase() + tier.slice(1)}`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Awarded by ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in award-combat command:', error);
      await interaction.reply({ 
        content: 'There was an error awarding points!', 
        ephemeral: true 
      });
    }
  },
}; 