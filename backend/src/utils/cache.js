import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class CacheManager {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.localCache = new Map(); // Fallback en memoria
    this.localCacheTTL = 5 * 60 * 1000; // 5 minutos
    
    this.initialize();
  }

  async initialize() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
          }
        });

        this.redis.on('connect', () => {
          console.log(' Redis connected');
          this.enabled = true;
        });

        this.redis.on('error', (err) => {
          console.warn(' Redis error:', err.message);
          this.enabled = false;
        });

      } catch (error) {
        console.warn(' Redis initialization failed:', error.message);
        this.enabled = false;
      }
    } else {
      console.log(' Redis not configured, using local memory cache');
    }
  }

  async get(key) {
    // Intentar Redis primero
    if (this.enabled && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) return JSON.parse(value);
      } catch (error) {
        console.warn('Redis get error:', error.message);
      }
    }

    // Fallback a caché local
    const localValue = this.localCache.get(key);
    if (localValue && Date.now() < localValue.expiry) {
      return localValue.data;
    }
    
    return null;
  }

  async set(key, value, ttl = 300) {
    const data = JSON.stringify(value);
    
    // Guardar en Redis
    if (this.enabled && this.redis) {
      try {
        await this.redis.setex(key, ttl, data);
      } catch (error) {
        console.warn('Redis set error:', error.message);
      }
    }

    // Guardar en caché local también
    this.localCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000)
    });

    // Limpiar caché viejo periódicamente
    if (this.localCache.size > 1000) {
      this.cleanLocalCache();
    }
  }

  async del(key) {
    if (this.enabled && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn('Redis del error:', error.message);
      }
    }
    this.localCache.delete(key);
  }

  async invalidatePattern(pattern) {
    if (this.enabled && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn('Redis invalidate error:', error.message);
      }
    }

    // Limpiar local cache por patrón
    for (const key of this.localCache.keys()) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(key)) {
        this.localCache.delete(key);
      }
    }
  }

  cleanLocalCache() {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now >= value.expiry) {
        this.localCache.delete(key);
      }
    }
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.localCache.clear();
  }
}

// Singleton instance
export const cache = new CacheManager();

// Middleware para cachear respuestas
export const cacheMiddleware = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    
    try {
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`🎯 Cache hit: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Interceptar res.json
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Guardar en cache si es exitoso
        if (res.statusCode === 200) {
          cache.set(cacheKey, data, ttl).catch(err => 
            console.warn('Cache set error:', err)
          );
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};
