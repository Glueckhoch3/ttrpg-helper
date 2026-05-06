import Ajv from 'ajv';
import { saveJson } from './model.js';

const ajv = new Ajv({ allErrors: true, strict: false });

// Basic permissive schema: require an object root. Replace with specific schema as needed.
const baseSchema = {
  type: 'object',
  additionalProperties: true,
};

const validate = ajv.compile(baseSchema);

export async function processImport(payload, filename) {
  const valid = validate(payload);
  if (!valid) {
    const err = new Error('Payload validation failed');
    err.status = 400;
    err.details = validate.errors;
    throw err;
  }

  // Save via model
  const meta = await saveJson(payload, filename);
  return meta; // { id, path }
}
