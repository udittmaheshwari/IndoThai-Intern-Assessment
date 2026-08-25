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

/**
 * Async generator that reads the CSV file line-by-line 
 * and yields parsed row objects.
 */
export async function* readCsvRows(overridePath) {
  // 2) Configurable path (env var with fallback)
  const rawFilePath = overridePath || process.env.CSV_FILE_PATH || './order_updates.csv';
  const fullPath = path.resolve(__dirname, '..', rawFilePath);

  // 1. Open readable stream
  const fileStream = fs.createReadStream(fullPath);

  // 3) Gracefully handle missing/invalid path errors
  let hasError = false;
  fileStream.on('error', (err) => {
    hasError = true;
    console.error(`[Error] Unable to open CSV file at "${fullPath}":`, err.message);
  });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;

  // Stream each line using for-await-of over readline
  for await (const line of rl) {
    if (hasError){
      throw new Error(`Failed to read CSV file`);
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1) Skip header line
    if (isHeader) {
      isHeader = false;
      continue;
    }

    // Split fields and map to row object
    const [event_id, symbol, transaction_type, quantity] = trimmed.split(',');

    const row = {
      event_id: event_id?.trim(),
      symbol: symbol?.trim(),
      transaction_type: transaction_type?.trim(),
      quantity: quantity?.trim()
    };

    // Yield each object to index.js incrementally
    yield row;
  }

}