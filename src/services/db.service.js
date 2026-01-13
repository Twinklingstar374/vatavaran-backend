import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

checkConnection();

export default prisma;
