import { processImport } from '../modules/importer/service.js';

test('processImport validates and returns metadata for valid object', async () => {
  const payload = { foo: 'bar' };
  const meta = await processImport(payload, `test-service-${Date.now()}.json`);
  expect(meta).toHaveProperty('id');
  expect(meta).toHaveProperty('path');
});

test('processImport rejects non-object payload', async () => {
  await expect(processImport('string', 'f.json')).rejects.toHaveProperty('status');
});
