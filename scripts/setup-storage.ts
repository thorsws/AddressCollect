/**
 * Setup script to create Supabase Storage bucket for campaign assets
 * Run with: npx tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually
function loadEnv() {
  try {
    // Try multiple paths
    const paths = [
      resolve(process.cwd(), '.env.local'),
      '/Users/janrosen/NewApps/AddressCollect/.env.local'
    ];

    let envContent: string | null = null;
    let loadedPath: string = '';

    for (const envPath of paths) {
      try {
        envContent = readFileSync(envPath, 'utf-8');
        loadedPath = envPath;
        break;
      } catch {
        // Try next path
      }
    }

    if (!envContent) {
      console.error('Could not find .env.local in any location');
      return;
    }

    console.log(`Loading env from: ${loadedPath}`);
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (err) {
    console.error('Could not load .env.local:', err);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('Setting up Supabase Storage...\n');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError.message);
    process.exit(1);
  }

  const bucketName = 'campaign-assets';
  const existingBucket = buckets?.find(b => b.name === bucketName);

  if (existingBucket) {
    console.log(`✓ Bucket "${bucketName}" already exists`);
  } else {
    // Create the bucket
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (error) {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }

    console.log(`✓ Created bucket "${bucketName}"`);
  }

  console.log('\n✓ Storage setup complete!');
  console.log('\nBucket settings:');
  console.log('  - Name: campaign-assets');
  console.log('  - Public: yes');
  console.log('  - Max file size: 5MB');
  console.log('  - Allowed types: JPEG, PNG, GIF, WebP');
}

setupStorage().catch(console.error);
