const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Ignore messages in DMs
    if (!message.guild) return;
    
    // No automatic point awarding - only manual awarding by event coordinators
    // This event handler is kept for potential future use
  },
}; 