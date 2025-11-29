import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const numCPUs = os.cpus().length;
const WORKERS = process.env.WORKERS || Math.min(numCPUs, 4); // Max 4 workers por defecto

if (cluster.isPrimary) {
  console.log(` Master process ${process.pid} is running`);
  console.log(` Spawning ${WORKERS} worker processes...`);
  
  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  // Estadísticas
  let workerStats = {};
  
  cluster.on('online', (worker) => {
    console.log(` Worker ${worker.process.pid} is online`);
    workerStats[worker.id] = {
      pid: worker.process.pid,
      startTime: Date.now(),
      restarts: 0
    };
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(` Worker ${worker.process.pid} died (${signal || code})`);
    
    // Reiniciar worker automáticamente
    if (!worker.exitedAfterDisconnect) {
      const newWorker = cluster.fork();
      workerStats[newWorker.id] = {
        ...workerStats[worker.id],
        restarts: (workerStats[worker.id]?.restarts || 0) + 1
      };
      console.log(` Spawning new worker ${newWorker.process.pid} to replace ${worker.process.pid}`);
    }
    
    delete workerStats[worker.id];
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(' SIGTERM received, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].send('shutdown');
      cluster.workers[id].disconnect();
    }
    
    setTimeout(() => {
      console.log(' Force shutdown after timeout');
      process.exit(0);
    }, 30000); // 30 segundos para terminar
  });

  // Endpoint de stats (simplificado)
  setInterval(() => {
    const stats = Object.values(workerStats).map(w => ({
      pid: w.pid,
      uptime: Math.floor((Date.now() - w.startTime) / 1000),
      restarts: w.restarts
    }));
    console.log(' Worker stats:', JSON.stringify(stats, null, 2));
  }, 60000); // Cada minuto

} else {
  // Workers importan y ejecutan el servidor
  import('./server.js').then(() => {
    console.log(` Worker ${process.pid} started`);
  }).catch(err => {
    console.error(`Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  });

  // Escuchar señales del master
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`Worker ${process.pid} received shutdown signal`);
      
      // Cerrar servidor gracefully
      setTimeout(() => {
        process.exit(0);
      }, 10000); // 10 segundos para terminar requests
    }
  });
}
