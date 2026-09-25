import { DataSource } from 'typeorm';

// Used by the TypeORM CLI (see the `migration:*` scripts); the app itself
// configures TypeORM through DatabaseModule.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on variables already present in the environment.
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [`${import.meta.dirname}/../**/*.entity.js`],
  migrations: [`${import.meta.dirname}/migrations/*.js`],
});
