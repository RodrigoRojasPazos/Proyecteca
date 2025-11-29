import rateLimit from 'express-rate-limit';

// Intentar importar Redis (opcional)
let RedisStore, Redis;
try {
  RedisStore = (await import('rate-limit-redis')).default;
  Redis = (await import('ioredis')).default;
} catch (e) {
  console.log(' Redis packages not installed, using memory store for rate limiting');
}

// Rate limiters por tipo de operación
export const createRateLimiters = () => {
  let redisClient = null;
  let store = undefined;

  if (process.env.REDIS_URL && Redis) {
    try {
      redisClient = new Redis(process.env.REDIS_URL);
      store = new RedisStore({
        client: redisClient,
        prefix: 'rl:',
      });
      console.log(' Using Redis for rate limiting');
    } catch (e) {
      console.log(' Redis connection failed, falling back to memory store');
    }
  } else {
    console.log('ℹ Using memory store for rate limiting (not shared across workers)');
  }

  // Rate limiter general (moderado)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skip: (req) => req.path === '/api/health'
  });

  // Rate limiter para autenticación (más estricto)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Solo 5 intentos de login por 15 min
    message: { error: 'Demasiados intentos de inicio de sesión' },
    skipSuccessfulRequests: true,
    store
  });

  // Rate limiter para uploads (más permisivo pero con límite)
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // 20 uploads por hora
    message: { error: 'Límite de uploads alcanzado, intenta más tarde' },
    store
  });

  // Rate limiter para búsquedas (moderado)
  const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 búsquedas por minuto
    message: { error: 'Demasiadas búsquedas, espera un momento' },
    store
  });

  return {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    searchLimiter
  };
};

// Adaptive rate limiting basado en carga del servidor
export class AdaptiveRateLimiter {
  constructor() {
    this.baseMax = 100;
    this.currentLoad = 0;
    this.checkInterval = 30000; // 30 segundos
    
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Calcular "carga" simple basada en memoria
      this.currentLoad = (usage.heapUsed / usage.heapTotal) * 100;
      
      console.log(` Server load: ${this.currentLoad.toFixed(2)}% heap used`);
    }, this.checkInterval);
  }

  getMaxRequests() {
    // Reducir límite si carga es alta
    if (this.currentLoad > 80) {
      return Math.floor(this.baseMax * 0.5); // 50% del límite
    } else if (this.currentLoad > 60) {
      return Math.floor(this.baseMax * 0.75); // 75% del límite
    }
    return this.baseMax;
  }

  middleware() {
    return (req, res, next) => {
      const max = this.getMaxRequests();
      req.rateLimit = { max, current: this.currentLoad };
      next();
    };
  }
}
