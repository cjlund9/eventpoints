const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('award-collection')
    .setDescription('Award points for collection log tier (Event Coordinator only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to award points to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Collection log tier')
        .setRequired(true)
        .addChoices(
          { name: 'Bronze (3 points)', value: 'bronze' },
          { name: 'Iron (5 points)', value: 'iron' },
          { name: 'Steel (10 points)', value: 'steel' },
          { name: 'Black (30 points)', value: 'black' },
          { name: 'Mithril (50 points)', value: 'mithril' },
          { name: 'Adamant (80 points)', value: 'adamant' },
          { name: 'Rune (90 points)', value: 'rune' },
          { name: 'Dragon (100 points)', value: 'dragon' },
          { name: 'Guilded (200 points)', value: 'guilded' }
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
      const pointsAwarded = await interaction.client.eventPoints.awardCollectionLog(
        targetUser.id,
        targetUser.username,
        tier,
        interaction.user.id
      );
      
      const newPoints = await interaction.client.eventPoints.getPoints(targetUser.id);
      
      const embed = new EmbedBuilder()
        .setColor('#4ecdc4')
        .setTitle('📚 Collection Log Points Awarded!')
        .setDescription(`${targetUser.username} received **${pointsAwarded} points** for Collection Log ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`)
        .addFields(
          { name: 'Points Awarded', value: `+${pointsAwarded}`, inline: true },
          { name: 'New Total', value: `${newPoints.toLocaleString()}`, inline: true },
          { name: 'Achievement', value: `Collection Log ${tier.charAt(0).toUpperCase() + tier.slice(1)}`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Awarded by ${interaction.user.username}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in award-collection command:', error);
      await interaction.reply({ 
        content: 'There was an error awarding points!', 
        ephemeral: true 
      });
    }
  },
}; 