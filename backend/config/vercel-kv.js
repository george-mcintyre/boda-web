const { kv } = require('@vercel/kv');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Vercel KV configuration
const getKVConfig = () => {
  if (isVercel || isProduction) {
    // Production - use Vercel KV
    return {
      useKV: true,
      kv: kv
    };
  } else {
    // Local development - use file system fallback
    return {
      useKV: false,
      kv: null
    };
  }
};

// Data access layer that works with both KV and file system
class DataStore {
  constructor() {
    this.config = getKVConfig();
    this.fs = require('fs');
    this.path = require('path');
  }

  // Generic get method
  async get(key) {
    if (this.config.useKV) {
      try {
        const data = await this.config.kv.get(key);
        return data;
      } catch (error) {
        console.error(`Error getting ${key} from KV:`, error);
        return null;
      }
    } else {
      // Local file system fallback
      const filePath = this.path.join(__dirname, '../data', `${key}.json`);
      if (this.fs.existsSync(filePath)) {
        try {
          const data = this.fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data);
        } catch (error) {
          console.error(`Error reading ${key} from file:`, error);
          return null;
        }
      }
      return null;
    }
  }

  // Generic set method
  async set(key, value) {
    if (this.config.useKV) {
      try {
        await this.config.kv.set(key, value);
        return true;
      } catch (error) {
        console.error(`Error setting ${key} in KV:`, error);
        return false;
      }
    } else {
      // Local file system fallback
      const filePath = this.path.join(__dirname, '../data', `${key}.json`);
      try {
        this.fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
        return true;
      } catch (error) {
        console.error(`Error writing ${key} to file:`, error);
        return false;
      }
    }
  }

  // Generic delete method
  async delete(key) {
    if (this.config.useKV) {
      try {
        await this.config.kv.del(key);
        return true;
      } catch (error) {
        console.error(`Error deleting ${key} from KV:`, error);
        return false;
      }
    } else {
      // Local file system fallback
      const filePath = this.path.join(__dirname, '../data', `${key}.json`);
      try {
        if (this.fs.existsSync(filePath)) {
          this.fs.unlinkSync(filePath);
        }
        return true;
      } catch (error) {
        console.error(`Error deleting ${key} from file:`, error);
        return false;
      }
    }
  }

  // List all keys (for KV)
  async listKeys(pattern = '*') {
    if (this.config.useKV) {
      try {
        return await this.config.kv.keys(pattern);
      } catch (error) {
        console.error(`Error listing keys from KV:`, error);
        return [];
      }
    } else {
      // Local file system fallback
      const dataDir = this.path.join(__dirname, '../data');
      if (this.fs.existsSync(dataDir)) {
        return this.fs.readdirSync(dataDir)
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
      }
      return [];
    }
  }

  // Get environment info
  getEnvironmentInfo() {
    return {
      environment: isVercel ? 'Vercel' : isProduction ? 'Production' : 'Local',
      storage: this.config.useKV ? 'Vercel KV' : 'File System',
      isVercel: isVercel,
      isProduction: isProduction
    };
  }
}

// Create singleton instance
const dataStore = new DataStore();

module.exports = {
  dataStore,
  getKVConfig
};
