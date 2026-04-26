process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-secret-test-secret-test-secret-test';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-test-refresh-test-refresh';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
process.env.API_VERSION_HEADER =
  process.env.API_VERSION_HEADER ?? 'X-API-Version';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
process.env.PORT = process.env.PORT ?? '0';
