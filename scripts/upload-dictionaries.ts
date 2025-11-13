#!/usr/bin/env node
/**
 * Dictionary Upload Script
 *
 * Uploads all installed dictionary packages to R2 for lazy loading.
 * Generates a languages.json manifest with metadata for each language.
 *
 * Usage: npm run upload-dictionaries
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// Cloudflare R2 configuration (using S3-compatible API)
const ACCOUNT_ID = '0460574641fdbb98159c98ebf593e2bd';
const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_BUCKET = 'spell-checker-dictionaries';

// Get credentials from environment
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('❌ Missing R2 credentials!');
  console.error('Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables.');
  console.error('\nTo create API tokens:');
  console.error('1. Cloudflare Dashboard → R2 → Manage R2 API Tokens');
  console.error('2. Create API Token with "Admin Read & Write" permissions');
  console.error('3. Copy Access Key ID and Secret Access Key');
  console.error('4. Run: export R2_ACCESS_KEY_ID="your_key_id"');
  console.error('5. Run: export R2_SECRET_ACCESS_KEY="your_secret_key"');
  process.exit(1);
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

interface LanguageMetadata {
  code: string;
  name: string;
  affSize: number;
  dicSize: number;
  totalSize: number;
}

/**
 * Discover all installed dictionary packages
 */
function discoverDictionaries(): string[] {
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  const packages: string[] = [];

  try {
    const dirs = readdirSync(nodeModulesPath);

    for (const dir of dirs) {
      if (dir.startsWith('dictionary-')) {
        const pkgPath = join(nodeModulesPath, dir);
        const affPath = join(pkgPath, 'index.aff');
        const dicPath = join(pkgPath, 'index.dic');

        // Check if both files exist
        if (existsSync(affPath) && existsSync(dicPath)) {
          packages.push(dir);
        }
      }
    }

    return packages.sort();
  } catch (error) {
    console.error('Failed to scan node_modules:', error);
    return [];
  }
}

/**
 * Get human-readable language name from package name
 */
function getLanguageName(packageName: string): string {
  const code = packageName.replace('dictionary-', '');

  // Map language codes to names
  const languageNames: Record<string, string> = {
    'en': 'English (US)',
    'en-au': 'English (Australia)',
    'en-ca': 'English (Canada)',
    'en-gb': 'English (UK)',
    'en-za': 'English (South Africa)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'nl': 'Dutch',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'pl': 'Polish',
    'cs': 'Czech',
    'ro': 'Romanian',
    'sv': 'Swedish',
    'da': 'Danish',
    'nb': 'Norwegian Bokmål',
    'nn': 'Norwegian Nynorsk',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'cy': 'Welsh',
    'el': 'Greek',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'eu': 'Basque',
    'fo': 'Faroese',
    'fur': 'Friulian',
    'fy': 'Frisian',
    'ga': 'Irish',
    'gd': 'Scottish Gaelic',
    'gl': 'Galician',
    'he': 'Hebrew',
    'hr': 'Croatian',
    'hu': 'Hungarian',
    'hy': 'Armenian',
    'is': 'Icelandic',
    'ka': 'Georgian',
    'ko': 'Korean',
    'lt': 'Lithuanian',
    'lv': 'Latvian',
    'mk': 'Macedonian',
    'mn': 'Mongolian',
    'fa': 'Persian',
    'br': 'Breton',
    'la': 'Latin',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'sr': 'Serbian',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'vi': 'Vietnamese',
  };

  return languageNames[code] || code.toUpperCase();
}

/**
 * Upload a file to R2
 */
async function uploadFile(
  key: string,
  content: Buffer,
  contentType: string
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: content,
      ContentType: contentType,
    })
  );
}

/**
 * Main upload function
 */
async function uploadDictionaries() {
  console.log('🔍 Discovering installed dictionaries...\n');

  const packages = discoverDictionaries();

  if (packages.length === 0) {
    console.error('❌ No dictionary packages found!');
    console.error('Run: npm install dictionary-en dictionary-es ...');
    process.exit(1);
  }

  console.log(`✅ Found ${packages.length} dictionaries:\n`);

  const languageMetadata: LanguageMetadata[] = [];
  let uploadCount = 0;
  let errorCount = 0;

  for (const pkgName of packages) {
    const code = pkgName.replace('dictionary-', '');
    const name = getLanguageName(pkgName);

    process.stdout.write(`   [${uploadCount + 1}/${packages.length}] ${code.padEnd(10)} ${name}... `);

    try {
      const pkgPath = join(process.cwd(), 'node_modules', pkgName);
      const affPath = join(pkgPath, 'index.aff');
      const dicPath = join(pkgPath, 'index.dic');

      // Read files
      const affData = readFileSync(affPath);
      const dicData = readFileSync(dicPath);

      const affSize = affData.length;
      const dicSize = dicData.length;

      // Upload to R2
      await uploadFile(`dictionaries/${code}.aff`, affData, 'text/plain; charset=utf-8');
      await uploadFile(`dictionaries/${code}.dic`, dicData, 'text/plain; charset=utf-8');

      // Store metadata
      languageMetadata.push({
        code,
        name,
        affSize,
        dicSize,
        totalSize: affSize + dicSize,
      });

      const totalKB = Math.round((affSize + dicSize) / 1024);
      console.log(`✓ (${totalKB}KB)`);
      uploadCount++;
    } catch (error) {
      console.log(`✗ FAILED`);
      console.error(`      Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }
  }

  console.log('\n📦 Uploading languages manifest...');

  // Sort by language code
  languageMetadata.sort((a, b) => a.code.localeCompare(b.code));

  // Create manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalLanguages: languageMetadata.length,
    languages: languageMetadata,
  };

  // Upload manifest
  await uploadFile(
    'languages.json',
    Buffer.from(JSON.stringify(manifest, null, 2)),
    'application/json'
  );

  const totalSize = languageMetadata.reduce((sum, lang) => sum + lang.totalSize, 0);
  const totalMB = (totalSize / 1024 / 1024).toFixed(2);

  console.log('\n═══════════════════════════════════════════');
  console.log('   DICTIONARY UPLOAD COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Uploaded: ${uploadCount} languages`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} languages`);
  }
  console.log(`📊 Total size: ${totalMB} MB`);
  console.log(`🗄️  Bucket: ${R2_BUCKET}`);
  console.log(`📋 Manifest: languages.json`);
  console.log('═══════════════════════════════════════════\n');
}

// Run the upload
uploadDictionaries().catch((error) => {
  console.error('\n❌ Upload failed:', error);
  process.exit(1);
});
