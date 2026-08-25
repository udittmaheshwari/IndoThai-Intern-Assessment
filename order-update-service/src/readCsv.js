/*

things to keep check =>

    1)The first line is the header (event_id,symbol,transaction_type,quantity) — must detect and skip it, not treat it as row 1 of data.

    2)Don't hardcode the CSV path — read it from a config value (env var). This satisfies the "input file path must be configurable" requirement. A simple approach: process.env.CSV_PATH || './order_updates.csv'


    3)Handle the file-not-found case gracefully — what happens if the configured path is wrong? It shouldn't crash the process unhandled; catch the stream's 'error' event and log something useful

*/




import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configurable path with fallback requirement: process.env.CSV_FILE_PATH || './order_updates.csv'
const rawFilePath = process.env.CSV_FILE_PATH || './order_updates.csv';
const fullPath = path.resolve(__dirname, '..', rawFilePath);

// 1. Open readable stream over file
const fileStream = fs.createReadStream(fullPath);

// Gracefully handle file-not-found / missing path errors without crashing
fileStream.on('error', (err) => {
  console.error(`[Error] Unable to open CSV file at "${fullPath}":`, err.message);
});

// 2. Open readline interface over fs.createReadStream
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity // Handles \r\n line breaks correctly
});

let isHeader = true;

// Process line by line incrementally
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return; // Skip empty lines

  // Requirement: Skip header (first line)
  if (isHeader) {
    isHeader = false;
    return;
  }

  // Requirement: Split into fields
  const [event_id, symbol, transaction_type, quantity] = trimmed.split(',');

  // Requirement: Build raw row object
  const row = {
    event_id: event_id?.trim(),
    symbol: symbol?.trim(),
    transaction_type: transaction_type?.trim(),
    quantity: quantity?.trim()
  };

  // Requirement: Console log raw row object
  console.log(row);
});

// Requirement: Log required message when stream ends
rl.on('close', () => {
  console.log("input processing complete");
});