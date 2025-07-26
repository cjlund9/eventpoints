const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-event')
    .setDescription('Award points for event participation (Event Coordinator only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to award points to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of the event participation')
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

    const targetUser = interaction.options.getUser('user');
    const description = interaction.options.getString('description') || 'Event participation';
    
    try {
      const pointsAwarded = await interaction.client.eventPoints.awardEventParticipation(
        targetUser.id,
        targetUser.username,
        interaction.user.id,
        description
      );
      
      const newPoints = await interaction.client.eventPoints.getPoints(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎉 Event Points Awarded!')
        .setDescription(`${targetUser.username} received **${pointsAwarded} points** for event participation!`)
        .addFields(
          { name: 'Points Awarded', value: `+${pointsAwarded}`, inline: true },
          { name: 'New Total', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Event', value: description, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Awarded by ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in award-event command:', error);
      await interaction.reply({ 
        content: 'There was an error awarding points!', 
        ephemeral: true 
      });
    }
  },
}; 