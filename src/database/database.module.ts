import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/configuration.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('database', { infer: true });
        return {
          type: 'postgres' as const,
          host: db.host,
          port: db.port,
          username: db.user,
          password: db.password,
          database: db.name,
          synchronize: db.synchronize,
          autoLoadEntities: true,
          // Compiled migrations live next to this file in dist/.
          migrations: [`${import.meta.dirname}/migrations/*.js`],
          migrationsRun: !db.synchronize,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
