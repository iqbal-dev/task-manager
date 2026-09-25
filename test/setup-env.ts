// e2e tests run against a real Postgres. Locally that is the docker-compose db;
// in CI it is a service container. Variables already set win over .env.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on variables already present in the environment.
}
process.env.NODE_ENV = 'test';
// Fresh databases have no migrations applied when running from TS sources.
process.env.DB_SYNCHRONIZE = 'true';
process.env.JWT_SECRET ??= 'e2e-only-secret-not-used-anywhere-else';
