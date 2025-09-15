import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    const uri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;
    return {
      module: DatabaseModule,
      imports: uri ? [MongooseModule.forRoot(uri, { dbName })] : [],
    };
  }
}
