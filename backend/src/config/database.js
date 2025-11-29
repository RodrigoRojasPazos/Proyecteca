import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configurar SSL solo si está habilitado en .env
const sslEnabled = process.env.DB_SSL_ENABLED === 'true';

const dialectOptions = {
  connectTimeout: 60000
};

// Solo agregar SSL si está habilitado
if (sslEnabled) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Desactiva logs de queries SQL
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /PROTOCOL_CONNECTION_LOST/
      ],
      max: 3
    }
  }
);

export default sequelize;