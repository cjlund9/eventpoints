const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-custom')
    .setDescription('Award custom points (Event Coordinator only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to award points to')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('points')
        .setDescription('Number of points to award')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10000))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of why points are being awarded')
        .setRequired(true)),
  
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
    const points = interaction.options.getInteger('points');
    const description = interaction.options.getString('description');
    
    try {
      const pointsAwarded = await interaction.client.eventPoints.awardCustomPoints(
        targetUser.id,
        targetUser.username,
        points,
        description,
        interaction.user.id
      );
      
      const newPoints = await interaction.client.eventPoints.getPoints(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('🎯 Custom Points Awarded!')
        .setDescription(`${targetUser.username} received **${pointsAwarded} points**!`)
        .addFields(
          { name: 'Points Awarded', value: `+${pointsAwarded}`, inline: true },
          { name: 'New Total', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Reason', value: description, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Awarded by ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in award-custom command:', error);
      await interaction.reply({ 
        content: 'There was an error awarding points!', 
        ephemeral: true 
      });
    }
  },
}; 