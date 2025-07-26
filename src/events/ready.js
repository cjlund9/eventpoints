const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`Ironclad Event Points bot is now online!`);
    
    // Set bot status
    client.user.setActivity('Ironclad Event Points', { type: 'WATCHING' });
  },
}; 