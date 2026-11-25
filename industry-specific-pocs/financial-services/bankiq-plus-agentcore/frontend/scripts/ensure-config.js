// src/config.js is generated at deploy time and gitignored. On a fresh clone,
// start from the committed placeholders so build, dev and test still work.
import { copyFileSync, existsSync } from 'node:fs';

if (!existsSync('src/config.js')) {
  copyFileSync('src/config.example.js', 'src/config.js');
  console.log('src/config.js not found: copied placeholders from src/config.example.js');
}
