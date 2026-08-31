// Gera o hash de uma senha para a coluna senha_hash.
//   node scripts/hash-password.mjs "a-senha-aqui"
import { hashPassword } from '../api/_users.js';

const senha = process.argv[2];
if (!senha) {
  console.error('Uso: node scripts/hash-password.mjs "a-senha-aqui"');
  process.exit(1);
}
console.log(await hashPassword(senha));
