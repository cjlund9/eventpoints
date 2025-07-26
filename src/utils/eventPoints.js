const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'event_points.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Event points table
  db.run(`CREATE TABLE IF NOT EXISTS event_points (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    last_activity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Event activities table
  db.run(`CREATE TABLE IF NOT EXISTS event_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    points_earned INTEGER NOT NULL,
    description TEXT,
    awarded_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES event_points (user_id)
  )`);

  // Shop items table
  db.run(`CREATE TABLE IF NOT EXISTS shop_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    role_id TEXT,
    custom_reward TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User purchases table
  db.run(`CREATE TABLE IF NOT EXISTS user_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES event_points (user_id),
    FOREIGN KEY (item_id) REFERENCES shop_items (id)
  )`);
});

class EventPoints {
  // Get or create event points user
  static async getUser(userId, username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM event_points WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          // Create new user
          db.run('INSERT INTO event_points (user_id, username, points) VALUES (?, ?, 0)', 
            [userId, username], function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({
              user_id: userId,
              username: username,
              points: 0,
              last_activity: null,
              created_at: new Date().toISOString()
            });
          });
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get user's event points
  static async getPoints(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT points FROM event_points WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ? row.points : 0);
      });
    });
  }

  // Add event points to user (for event coordinators)
  static async addPoints(userId, points, activityType, description = 'Event participation', awardedBy = null) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE event_points SET points = points + ?, last_activity = CURRENT_TIMESTAMP WHERE user_id = ?', 
        [points, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Log activity
        db.run('INSERT INTO event_activities (user_id, activity_type, points_earned, description, awarded_by) VALUES (?, ?, ?, ?, ?)',
          [userId, activityType, points, description, awardedBy], (err) => {
          if (err) {
            console.error('Failed to log event activity:', err);
          }
          resolve(points);
        });
      });
    });
  }

  // Award points for event participation
  static async awardEventParticipation(userId, username, awardedBy, description = 'Event participation') {
    const points = parseInt(process.env.EVENT_POINTS_PER_ACTIVITY) || 10;
    await this.getUser(userId, username);
    return this.addPoints(userId, points, 'event_participation', description, awardedBy);
  }

  // Award points for combat achievements
  static async awardCombatAchievement(userId, username, tier, awardedBy) {
    const tierPoints = {
      'grandmaster': parseInt(process.env.CA_GRANDMASTER) || 200,
      'master': parseInt(process.env.CA_MASTER) || 100,
      'elite': parseInt(process.env.CA_ELITE) || 75,
      'hard': parseInt(process.env.CA_HARD) || 50,
      'medium': parseInt(process.env.CA_MEDIUM) || 25,
      'easy': parseInt(process.env.CA_EASY) || 10
    };
    
    const tierName = tier.toLowerCase();
    const points = tierPoints[tierName] || 0;
    
    if (points === 0) {
      throw new Error('Invalid combat achievement tier');
    }
    
    await this.getUser(userId, username);
    return this.addPoints(userId, points, 'combat_achievement', `Combat Achievement ${tier}`, awardedBy);
  }

  // Award points for collection log
  static async awardCollectionLog(userId, username, tier, awardedBy) {
    const tierPoints = {
      'guilded': parseInt(process.env.CLOG_GUILDED) || 200,
      'dragon': parseInt(process.env.CLOG_DRAGON) || 100,
      'rune': parseInt(process.env.CLOG_RUNE) || 90,
      'adamant': parseInt(process.env.CLOG_ADAMANT) || 80,
      'mithril': parseInt(process.env.CLOG_MITHRIL) || 50,
      'black': parseInt(process.env.CLOG_BLACK) || 30,
      'steel': parseInt(process.env.CLOG_STEEL) || 10,
      'iron': parseInt(process.env.CLOG_IRON) || 5,
      'bronze': parseInt(process.env.CLOG_BRONZE) || 3
    };
    
    const tierName = tier.toLowerCase();
    const points = tierPoints[tierName] || 0;
    
    if (points === 0) {
      throw new Error('Invalid collection log tier');
    }
    
    await this.getUser(userId, username);
    return this.addPoints(userId, points, 'collection_log', `Collection Log ${tier}`, awardedBy);
  }

  // Award points for event competition
  static async awardEventCompetition(userId, username, eventType, placement, awardedBy) {
    const eventPoints = {
      'skill_week': {
        '1st': parseInt(process.env.EVENT_SKILL_WEEK_1ST) || 20,
        '2nd': parseInt(process.env.EVENT_SKILL_WEEK_2ND) || 10,
        '3rd': parseInt(process.env.EVENT_SKILL_WEEK_3RD) || 5
      },
      'clue_month': {
        '1st': parseInt(process.env.EVENT_CLUE_MONTH_1ST) || 20,
        '2nd': parseInt(process.env.EVENT_CLUE_MONTH_2ND) || 10,
        '3rd': parseInt(process.env.EVENT_CLUE_MONTH_3RD) || 5
      },
      'boss_week': {
        '1st': parseInt(process.env.EVENT_BOSS_WEEK_1ST) || 20,
        '2nd': parseInt(process.env.EVENT_BOSS_WEEK_2ND) || 10,
        '3rd': parseInt(process.env.EVENT_BOSS_WEEK_3RD) || 5
      },
      'bingo': {
        '1st': parseInt(process.env.EVENT_BINGO_1ST) || 20,
        '2nd': parseInt(process.env.EVENT_BINGO_2ND) || 5
      },
      'battleship': {
        '1st': parseInt(process.env.EVENT_BATTLESHIP_1ST) || 30,
        '2nd': parseInt(process.env.EVENT_BATTLESHIP_2ND) || 10
      },
      'mania': {
        '1st': parseInt(process.env.EVENT_MANIA_1ST) || 20,
        '2nd': parseInt(process.env.EVENT_MANIA_2ND) || 10,
        '3rd': parseInt(process.env.EVENT_MANIA_3RD) || 5
      },
      'bounty': {
        '1st': parseInt(process.env.EVENT_BOUNTY_1ST) || 10,
        '2nd': parseInt(process.env.EVENT_BOUNTY_2ND) || 5
      }
    };
    
    const eventName = eventType.toLowerCase().replace(/\s+/g, '_');
    const placementKey = placement.toLowerCase();
    
    const points = eventPoints[eventName]?.[placementKey] || 0;
    
    if (points === 0) {
      throw new Error('Invalid event type or placement');
    }
    
    await this.getUser(userId, username);
    return this.addPoints(userId, points, 'event_competition', `${eventType} - ${placement} Place`, awardedBy);
  }

  // Award custom points
  static async awardCustomPoints(userId, username, points, description, awardedBy) {
    await this.getUser(userId, username);
    return this.addPoints(userId, points, 'custom', description, awardedBy);
  }

  // Remove points from user
  static async removePoints(userId, points, description = 'Points deduction', removedBy = null) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE event_points SET points = points - ? WHERE user_id = ? AND points >= ?', 
        [points, userId, points], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Insufficient event points'));
          return;
        }
        
        // Log activity
        db.run('INSERT INTO event_activities (user_id, activity_type, points_earned, description, awarded_by) VALUES (?, ?, ?, ?, ?)',
          [userId, 'deduction', -points, description, removedBy], (err) => {
          if (err) {
            console.error('Failed to log event activity:', err);
          }
          resolve();
        });
      });
    });
  }

  // Get event points leaderboard
  static async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all('SELECT user_id, username, points FROM event_points ORDER BY points DESC LIMIT ?', 
        [limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get user's activity history
  static async getActivityHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM event_activities WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?', 
        [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get user statistics
  static async getUserStats(userId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          ep.points,
          ep.last_activity,
          COUNT(ea.id) as total_activities,
          SUM(CASE WHEN ea.points_earned > 0 THEN ea.points_earned ELSE 0 END) as total_earned,
          SUM(CASE WHEN ea.points_earned < 0 THEN ABS(ea.points_earned) ELSE 0 END) as total_spent
        FROM event_points ep
        LEFT JOIN event_activities ea ON ep.user_id = ea.user_id
        WHERE ep.user_id = ?
        GROUP BY ep.user_id
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || {
          points: 0,
          last_activity: null,
          total_activities: 0,
          total_earned: 0,
          total_spent: 0
        });
      });
    });
  }

  // Check if user has event coordinator role
  static hasEventCoordinatorRole(member) {
    const coordinatorRoleId = process.env.EVENT_COORDINATOR_ROLE_ID;
    return coordinatorRoleId && member.roles.cache.has(coordinatorRoleId);
  }

  // Get available combat achievement tiers
  static getCombatAchievementTiers() {
    return ['Easy', 'Medium', 'Hard', 'Elite', 'Master', 'Grandmaster'];
  }

  // Get available collection log tiers
  static getCollectionLogTiers() {
    return ['Bronze', 'Iron', 'Steel', 'Black', 'Mithril', 'Adamant', 'Rune', 'Dragon', 'Guilded'];
  }

  // Get available event types
  static getEventTypes() {
    return ['Skill of the Week', 'Clue of the Month', 'Boss of the Week', 'General Bingo', 'Battleship', 'Mania', 'Bounty'];
  }

  // Get available placements for an event type
  static getEventPlacements(eventType) {
    const eventName = eventType.toLowerCase().replace(/\s+/g, '_');
    
    const placements = {
      'skill_of_the_week': ['1st', '2nd', '3rd'],
      'clue_of_the_month': ['1st', '2nd', '3rd'],
      'boss_of_the_week': ['1st', '2nd', '3rd'],
      'general_bingo': ['1st', '2nd'],
      'battleship': ['1st', '2nd'],
      'mania': ['1st', '2nd', '3rd'],
      'bounty': ['1st', '2nd']
    };
    
    return placements[eventName] || [];
  }
}

module.exports = EventPoints; 