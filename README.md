# Ironclad Event Points Bot

A Discord bot for managing event points, achievements, and a customizable shop system.

## Features

### Event Points System
- Manual point awarding by Event Coordinators
- Event participation points
- Combat Achievement points (Easy to Grandmaster)
- Collection Log points (Bronze to Guilded)
- Event Competition points (1st, 2nd, 3rd place)
- Custom point awards
- Personal point tracking
- Leaderboard system

### Shop System
- Customizable shop items
- Role rewards
- Custom rewards
- Purchase history
- Admin management
- Event staff alerts for choice purchases

### Event Buy-in System
- Purchase event participation roles with points
- Automatic role assignment
- Participant management
- Configurable buy-in costs

### Entry Fee System
- Pay entry fees for specific events
- Automatic role assignment
- Configurable entry costs

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `env.example` to `.env`
   - Fill in your Discord bot token, client ID, and guild ID
   - Set your Event Coordinator role ID
   - Configure point values as needed
   - Set event buy-in costs and role IDs
   - Set shop item role IDs
   - Set entry fee role IDs

3. **Deploy Commands**
   ```bash
   npm run deploy
   ```

4. **Set up Shop Items**
   ```bash
   # Use the shop-setup command in Discord
   /shop-setup
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

## Commands

### User Commands
- `/points [user]` - Check your or another user's event points
- `/leaderboard [limit]` - View the event points leaderboard
- `/shop` - View available shop items
- `/buy <item_id> [choice]` - Purchase an item from the shop (choice required for SOTW/BOTW/COTW)
- `/event-buyin <event>` - Purchase event participation role
- `/entry-fee <event>` - Pay entry fee for events

### Event Coordinator Commands
- `/award-event <user> [description]` - Award points for event participation
- `/award-combat <user> <tier>` - Award points for combat achievements
- `/award-collection <user> <tier>` - Award points for collection log
- `/award-competition <user> <event> <placement>` - Award points for event competition
- `/award-custom <user> <points> <description>` - Award custom points
- `/shop-setup` - Set up default shop items
- `/shop-add <name> [description] <cost> [role] [custom_reward]` - Add shop item
- `/shop-remove <item_id>` - Remove shop item
- `/event-buyin-manage remove-role <user> <event>` - Remove event role from user
- `/event-buyin-manage list-participants <event>` - List event participants

## Point Values

### Combat Achievements
- Easy: 10 points
- Medium: 25 points
- Hard: 50 points
- Elite: 75 points
- Master: 100 points
- Grandmaster: 200 points

### Collection Log
- Bronze: 3 points
- Iron: 5 points
- Steel: 10 points
- Black: 30 points
- Mithril: 50 points
- Adamant: 80 points
- Rune: 90 points
- Dragon: 100 points
- Guilded: 200 points

### Event Competitions
- **Skill of the Week**: 1st (20), 2nd (10), 3rd (5)
- **Clue of the Month**: 1st (20), 2nd (10), 3rd (5)
- **Boss of the Week**: 1st (20), 2nd (10), 3rd (5)
- **General Bingo**: 1st (20), 2nd (5)
- **Battleship**: 1st (30), 2nd (10)
- **Mania**: 1st (20), 2nd (10), 3rd (5)
- **Bounty**: 1st (10), 2nd (5)

### Event Buy-ins
- **Skill of the Week**: 50 points
- **Clue of the Month**: 50 points
- **Boss of the Week**: 50 points
- **General Bingo**: 50 points
- **Battleship**: 50 points
- **Mania**: 50 points
- **Bounty**: 50 points

### Entry Fees
- **Bingo Entry**: 5 points
- **Battleship Entry**: 5 points
- **CvC Entry**: 20 points

### Shop Items
- **Choose SOTW**: 50 points
- **Choose BOTW**: 50 points
- **Choose COTW**: 50 points
- **Events Rank**: 1000 points
- **1 Alt Allowed**: 1000 points

### Event Participation
- Default: 10 points (configurable)

## Database

The bot uses SQLite to store:
- User event points
- Activity history
- Shop items
- Purchase history

## Configuration

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your Discord application client ID
- `GUILD_ID` - Your Discord server ID
- `EVENT_COORDINATOR_ROLE_ID` - Role ID for event coordinators
- `DATABASE_PATH` - Path to the SQLite database file

### Point Values (optional)
- `EVENT_POINTS_PER_ACTIVITY` - Points for event participation
- `CUSTOM_POINTS_DEFAULT` - Default custom points
- `CLOG_*` - Collection log point values
- `CA_*` - Combat achievement point values
- `EVENT_*` - Event competition point values
- `EVENT_*_BUYIN` - Event buy-in costs
- `EVENT_*_ROLE_ID` - Event participation role IDs
- `SHOP_*_ROLE_ID` - Shop item role IDs
- `ENTRY_*_ROLE_ID` - Entry fee role IDs

## Permissions

The bot requires the following Discord permissions:
- Send Messages
- Use Slash Commands
- Manage Roles (for shop role rewards and event buy-ins)
- Read Message History
- View Channels

## Development

- `npm run dev` - Start with nodemon for development
- `npm run deploy` - Deploy slash commands
- `npm start` - Start the production bot

## Support

For issues or questions, please contact the bot administrator. 