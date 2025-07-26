const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'economy.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table for economy
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    balance INTEGER DEFAULT ${process.env.STARTING_BALANCE || 1000},
    last_daily TEXT,
    last_weekly TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
  )`);

  // Event points table
  db.run(`CREATE TABLE IF NOT EXISTS event_points (
    user_id TEXT PRIMARY KEY,
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
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES event_points (user_id)
  )`);
});

class Economy {
  // Get or create user
  static async getUser(userId, username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          // Create new user
          const startingBalance = parseInt(process.env.STARTING_BALANCE) || 1000;
          db.run('INSERT INTO users (user_id, username, balance) VALUES (?, ?, ?)', 
            [userId, username, startingBalance], function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({
              user_id: userId,
              username: username,
              balance: startingBalance,
              last_daily: null,
              last_weekly: null
            });
          });
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get user balance
  static async getBalance(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT balance FROM users WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ? row.balance : 0);
      });
    });
  }

  // Add money to user
  static async addMoney(userId, amount, description = 'Transaction') {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET balance = balance + ? WHERE user_id = ?', 
        [amount, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Log transaction
        db.run('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
          [userId, 'add', amount, description], (err) => {
          if (err) {
            console.error('Failed to log transaction:', err);
          }
          resolve();
        });
      });
    });
  }

  // Remove money from user
  static async removeMoney(userId, amount, description = 'Transaction') {
    return new Promise((resolve, reject) => {
      db.run('UPDATE users SET balance = balance - ? WHERE user_id = ? AND balance >= ?', 
        [amount, userId, amount], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('Insufficient funds'));
          return;
        }
        
        // Log transaction
        db.run('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
          [userId, 'remove', amount, description], (err) => {
          if (err) {
            console.error('Failed to log transaction:', err);
          }
          resolve();
        });
      });
    });
  }

  // Transfer money between users
  static async transferMoney(fromUserId, toUserId, amount, description = 'Transfer') {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run('UPDATE users SET balance = balance - ? WHERE user_id = ? AND balance >= ?', 
          [amount, fromUserId, amount], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            reject(new Error('Insufficient funds'));
            return;
          }
          
          db.run('UPDATE users SET balance = balance + ? WHERE user_id = ?', 
            [amount, toUserId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Log transactions
            db.run('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
              [fromUserId, 'transfer_out', amount, description], (err) => {
              if (err) console.error('Failed to log outgoing transaction:', err);
            });
            
            db.run('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
              [toUserId, 'transfer_in', amount, description], (err) => {
              if (err) console.error('Failed to log incoming transaction:', err);
            });
            
            db.run('COMMIT');
            resolve();
          });
        });
      });
    });
  }

  // Get transaction history
  static async getTransactionHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?', 
        [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Get leaderboard
  static async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all('SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT ?', 
        [limit], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // Check if user can claim daily reward
  static async canClaimDaily(userId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT last_daily FROM users WHERE user_id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row || !row.last_daily) {
          resolve(true);
          return;
        }
        
        const lastDaily = new Date(row.last_daily);
        const now = new Date();
        const timeDiff = now - lastDaily;
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        resolve(timeDiff >= oneDay);
      });
    });
  }

  // Claim daily reward
  static async claimDaily(userId) {
    return new Promise((resolve, reject) => {
      const dailyAmount = parseInt(process.env.DAILY_REWARD) || 100;
      
      db.run('UPDATE users SET balance = balance + ?, last_daily = CURRENT_TIMESTAMP WHERE user_id = ?', 
        [dailyAmount, userId], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Log transaction
        db.run('INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)',
          [userId, 'add', dailyAmount, 'Daily reward'], (err) => {
          if (err) {
            console.error('Failed to log daily reward transaction:', err);
          }
          resolve(dailyAmount);
        });
      });
    });
  }
}

module.exports = Economy; 