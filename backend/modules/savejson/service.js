import Ajv from 'ajv';
import fs from 'node:fs/promises';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { saveJson } from './model.js';
import { UPLOAD_DIR } from '../../config/index.js';

const ajv = new Ajv({ allErrors: true, strict: false });

// Basic permissive schema: require an object root. Replace with specific schema as needed.
const baseSchema = {
  type: 'object',
  additionalProperties: true,
};

const validate = ajv.compile(baseSchema);

const ADVENTURE_ID_PATTERN = /^adv-(\d+)$/;

function parseAdventureSequence(id) {
  const match = ADVENTURE_ID_PATTERN.exec(String(id ?? '').trim());
  if (!match) {
    return Number.NaN;
  }

  return Number(match[1]);
}

function formatAdventureId(sequence) {
  return `adv-${String(sequence).padStart(3, '0')}`;
}

function nextAvailableSequence(usedSequences) {
  let candidate = 0;
  while (usedSequences.has(candidate)) {
    candidate += 1;
  }
  return candidate;
}

function normalizeTargetFilename(filename) {
  const name = typeof filename === 'string' ? filename.trim() : '';
  if (name.length === 0) {
    return null;
  }

  const safeName = sanitize(name);
  if (!safeName || safeName.length === 0) {
    const err = new Error('Invalid filename after sanitization');
    err.status = 400;
    throw err;
  }

  return path.basename(safeName).toLowerCase();
}

async function collectUsedAdventureSequences(excludedFilename) {
  const usedSequences = new Set();

  let entries;
  try {
    entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
  } catch (e) {
    if (e?.code === 'ENOENT') {
      return usedSequences;
    }
    throw e;
  }

  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => entry.name);

  for (const fileName of jsonFiles) {
    if (excludedFilename && fileName.toLowerCase() === excludedFilename) {
      continue;
    }

    const filePath = path.resolve(UPLOAD_DIR, path.basename(fileName));
    let parsed;
    try {
      const content = await fs.readFile(filePath, 'utf8');
      parsed = JSON.parse(content);
    } catch {
      continue;
    }

    const sequence = parseAdventureSequence(parsed?.metadata?.id);
    if (Number.isFinite(sequence)) {
      usedSequences.add(sequence);
    }
  }

  return usedSequences;
}

function ensureMetadataObject(payload) {
  if (!payload.metadata || typeof payload.metadata !== 'object' || Array.isArray(payload.metadata)) {
    payload.metadata = {};
  }

  return payload.metadata;
}

export async function processImport(payload, filename) {
  const valid = validate(payload);
  if (!valid) {
    const err = new Error('Payload validation failed');
    err.status = 400;
    err.details = validate.errors;
    throw err;
  }

  const metadata = ensureMetadataObject(payload);
  const excludedFilename = normalizeTargetFilename(filename);
  const usedSequences = await collectUsedAdventureSequences(excludedFilename);

  const incomingSequence = parseAdventureSequence(metadata.id);
  const resolvedSequence = Number.isFinite(incomingSequence) && !usedSequences.has(incomingSequence)
    ? incomingSequence
    : nextAvailableSequence(usedSequences);

  metadata.id = formatAdventureId(resolvedSequence);

  // Save via model
  const meta = await saveJson(payload, filename);
  return { ...meta, metadataId: metadata.id }; // { id, path, metadataId }
}
