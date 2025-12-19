import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Firebase RC file validation', () => {
  let config;

  beforeAll(() => {
    const filePath = resolve(__dirname, '.firebaserc');
    const rawdata = readFileSync(filePath, 'utf-8');
    config = JSON.parse(rawdata);
  });

  it('should be a valid JSON object', () => {
    expect(config).not.toBeNull();
    expect(config).toBeInstanceOf(Object);
  });

  it('should have a "projects" object with a "default" project alias', () => {
    expect(config.projects?.default).toEqual(expect.any(String));
    expect(config.projects.default.length).toBeGreaterThan(0);
  });

  it('should have "targets" and "etags" properties defined as objects', () => {
    expect(config.targets).toBeInstanceOf(Object);
    expect(config.etags).toBeInstanceOf(Object);
  });
});