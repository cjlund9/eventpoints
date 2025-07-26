# Discord Event Points Bot

A comprehensive Discord bot for managing event points, competitions, and rewards in gaming communities. Built with Discord.js and SQLite.

## Features

### 🏆 Event Points System
- Track points for various activities and achievements
- Collection log tier rewards (Bronze to Guilded)
- Combat achievement points (Easy to Grandmaster)
- Event competition placements (1st, 2nd, 3rd place)
- Custom point awards for special events

### 🛒 Shop System
- Purchase items with event points
- Role-based rewards
- Special event choices (SOTW, BOTW, COTW)
- Shop management for administrators

### 🎫 Event Management
- Event buy-ins for participation
- Entry fees for specific competitions
- Role assignment for event participants
- Event coordinator tools

### 📊 Leaderboards & Statistics
- Real-time leaderboards
- User point tracking
- Activity statistics
- Point history

## Commands

### User Commands
- `/points [user]` - Check your or another user's points
- `/leaderboard [limit]` - View the event points leaderboard
- `/shop` - Browse available shop items
- `/buy <item_id> [choice]` - Purchase items from the shop
- `/event-buyin <event>` - Purchase event participation
- `/entry-fee <event>` - Pay entry fees for competitions

### Administrator Commands
- `/award-collection <user> <tier>` - Award collection log points
- `/award-combat <user> <tier>` - Award combat achievement points
- `/award-competition <user> <event> <placement>` - Award competition points
- `/award-custom <user> <points> <description>` - Award custom points
- `/award-event <user> [description]` - Award event participation points
- `/shop-add <name> <cost> [description] [role] [custom_reward]` - Add shop items
- `/shop-remove <item_id>` - Remove shop items
- `/shop-setup` - Set up default shop items
- `/event-buyin-manage` - Manage event participants

## Setup

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token
- Discord Application with Bot permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ironclad-event-points
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Discord bot credentials and server settings:
   - `DISCORD_TOKEN` - Your bot token
   - `CLIENT_ID` - Your bot's client ID
   - `GUILD_ID` - Your Discord server ID
   - Role IDs for various events and permissions

4. **Deploy slash commands**
   ```bash
   node src/utils/deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   node src/index.js
   ```

### Environment Variables

See `env.example` for all available configuration options:

- **Discord Configuration**: Bot token, client ID, guild ID
- **Database**: SQLite database path
- **Point Values**: Collection log, combat achievements, event competitions
- **Event Costs**: Buy-in costs for various events
- **Role IDs**: Discord role IDs for permissions and rewards

## Database

The bot uses SQLite for data storage with the following main tables:
- `users` - User information and point balances
- `transactions` - Point transaction history
- `shop_items` - Available shop items
- `user_roles` - Role assignments and permissions

## Permissions

### Required Bot Permissions
- Send Messages
- Use Slash Commands
- Manage Roles (for role assignments)
- Read Message History
- Embed Links

### Role Requirements
- **Event Coordinator Role**: Required for awarding points and managing events
- **Event Participation Roles**: Assigned when users buy into events
- **Shop Role IDs**: For items that grant Discord roles

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in this repository
- Check the Discord.js documentation
- Review the environment configuration in `env.example`

## Changelog

### v1.0.0
- Initial release
- Complete event points system
- Shop functionality
- Event management tools
- Leaderboard and statistics 