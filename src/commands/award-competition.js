const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-competition')
    .setDescription('Award points for event competition placement (Event Coordinator only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to award points to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('event')
        .setDescription('The event type')
        .setRequired(true)
        .addChoices(
          { name: 'Skill of the Week', value: 'skill_of_the_week' },
          { name: 'Clue of the Month', value: 'clue_of_the_month' },
          { name: 'Boss of the Week', value: 'boss_of_the_week' },
          { name: 'General Bingo', value: 'general_bingo' },
          { name: 'Battleship', value: 'battleship' },
          { name: 'Mania', value: 'mania' },
          { name: 'Bounty', value: 'bounty' }
        ))
    .addStringOption(option =>
      option.setName('placement')
        .setDescription('The placement achieved')
        .setRequired(true)
        .addChoices(
          { name: '1st Place', value: '1st' },
          { name: '2nd Place', value: '2nd' },
          { name: '3rd Place', value: '3rd' }
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
    const eventType = interaction.options.getString('event');
    const placement = interaction.options.getString('placement');
    
    // Convert event type to display name
    const eventDisplayNames = {
      'skill_of_the_week': 'Skill of the Week',
      'clue_of_the_month': 'Clue of the Month',
      'boss_of_the_week': 'Boss of the Week',
      'general_bingo': 'General Bingo',
      'battleship': 'Battleship',
      'mania': 'Mania',
      'bounty': 'Bounty'
    };
    
    const eventName = eventDisplayNames[eventType];
    
    // Check if placement is valid for this event
    const validPlacements = interaction.client.eventPoints.getEventPlacements(eventName);
    if (!validPlacements.includes(placement)) {
      await interaction.reply({ 
        content: `❌ Invalid placement for ${eventName}. Valid placements: ${validPlacements.join(', ')}`, 
        ephemeral: true 
      });
      return;
    }
    
    try {
      const pointsAwarded = await interaction.client.eventPoints.awardEventCompetition(
        targetUser.id,
        targetUser.username,
        eventName,
        placement,
        interaction.user.id
      );
      
      const newPoints = await interaction.client.eventPoints.getPoints(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🏆 Event Competition Points Awarded!')
        .setDescription(`${targetUser.username} received **${pointsAwarded} points** for ${eventName}!`)
        .addFields(
          { name: 'Points Awarded', value: `+${pointsAwarded}`, inline: true },
          { name: 'New Total', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Event', value: eventName, inline: true },
          { name: 'Placement', value: `${placement} Place`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Awarded by ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in award-competition command:', error);
      await interaction.reply({ 
        content: 'There was an error awarding points!', 
        ephemeral: true 
      });
    }
  },
}; 