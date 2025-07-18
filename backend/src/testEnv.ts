import dotenv from 'dotenv';
import path from 'path';

// Força a leitura do .env no caminho correto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('PROJECT ID:', process.env.FIREBASE_PROJECT_ID);
console.log('CLIENT EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE KEY:', process.env.FIREBASE_PRIVATE_KEY ? '[ok]' : '[undefined]');
