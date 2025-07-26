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

class Shop {
  // Add a new shop item
  static async addItem(name, description, cost, roleId = null, customReward = null) {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO shop_items (name, description, cost, role_id, custom_reward) VALUES (?, ?, ?, ?, ?)',
        [name, description, cost, roleId, customReward], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  // Get all active shop items
  static async getItems() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM shop_items WHERE is_active = 1 ORDER BY cost ASC', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get a specific shop item
  static async getItem(itemId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM shop_items WHERE id = ? AND is_active = 1', [itemId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // Update a shop item
  static async updateItem(itemId, name, description, cost, roleId = null, customReward = null) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE shop_items SET name = ?, description = ?, cost = ?, role_id = ?, custom_reward = ? WHERE id = ?',
        [name, description, cost, roleId, customReward, itemId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  // Delete a shop item (set as inactive)
  static async deleteItem(itemId) {
    return new Promise((resolve, reject) => {
      db.run('UPDATE shop_items SET is_active = 0 WHERE id = ?', [itemId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  // Purchase an item
  static async purchaseItem(userId, itemId, itemName, cost) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Deduct points from user
        db.run('UPDATE event_points SET points = points - ? WHERE user_id = ? AND points >= ?', 
          [cost, userId, cost], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            reject(new Error('Insufficient points'));
            return;
          }
          
          // Log purchase
          db.run('INSERT INTO user_purchases (user_id, item_id, item_name, cost) VALUES (?, ?, ?, ?)',
            [userId, itemId, itemName, cost], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            db.run('COMMIT');
            resolve();
          });
        });
      });
    });
  }

  // Get user's purchase history
  static async getUserPurchases(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM user_purchases WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?', 
        [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get all purchases (for admin)
  static async getAllPurchases(limit = 50) {
    return new Promise((resolve, reject) => {
      db.all('SELECT up.*, ep.username FROM user_purchases up JOIN event_points ep ON up.user_id = ep.user_id ORDER BY up.timestamp DESC LIMIT ?', 
        [limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Check if user can afford an item
  static async canAfford(userId, cost) {
    const EventPoints = require('./eventPoints');
    const userPoints = await EventPoints.getPoints(userId);
    return userPoints >= cost;
  }

  // Get shop statistics
  static async getShopStats() {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_items,
          SUM(cost) as total_value,
          (SELECT COUNT(*) FROM user_purchases) as total_purchases,
          (SELECT SUM(cost) FROM user_purchases) as total_spent
        FROM shop_items 
        WHERE is_active = 1
      `, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || {
          total_items: 0,
          total_value: 0,
          total_purchases: 0,
          total_spent: 0
        });
      });
    });
  }
}

module.exports = Shop; 