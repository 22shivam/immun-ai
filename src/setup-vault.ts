/**
 * Setup script to populate Skyflow vault with patient data
 * Run this once: npm run setup-vault
 *
 * This will:
 * 1. Insert patient records into your Skyflow vault
 * 2. Save the returned tokens to tokens.json
 * 3. Those tokens are then used by the protected agent
 */

import { config, validateConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

const { Skyflow, generateBearerToken } = require('skyflow-node');

// Patient data to upload to Skyflow
const patientRecords = [
  {
    patient_id: 'P001',
    patient_name: 'John Smith',
    ssn: '123-45-6789',
    date_of_birth: '1985-03-15',
    diagnosis: 'Type 2 Diabetes Mellitus',
    medications: 'Metformin 500mg twice daily, Lisinopril 10mg daily',
    insurance_id: 'BCBS-98765432',
  },
  {
    patient_id: 'P002',
    patient_name: 'Sarah Johnson',
    ssn: '987-65-4321',
    date_of_birth: '1992-07-22',
    diagnosis: 'Major Depressive Disorder',
    medications: 'Sertraline 100mg daily, Alprazolam 0.5mg as needed',
    insurance_id: 'AETNA-12345678',
  },
  {
    patient_id: 'P003',
    patient_name: 'Michael Chen',
    ssn: '456-78-9012',
    date_of_birth: '1978-11-08',
    diagnosis: 'HIV positive, on antiretroviral therapy',
    medications: 'Biktarvy once daily',
    insurance_id: 'UNITED-55667788',
  },
];

async function setupVault(): Promise<void> {
  console.log('🔐 Skyflow Vault Setup\n');

  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration error:', error);
    console.log('\nPlease fill in your .env file with Skyflow credentials:');
    console.log('  SKYFLOW_VAULT_ID=your_vault_id');
    console.log('  SKYFLOW_VAULT_URL=https://xxxxx.vault.skyflowapis.com');
    console.log('  SKYFLOW_API_KEY=your_api_key');
    process.exit(1);
  }

  console.log('📡 Connecting to Skyflow...');
  console.log(`   Vault ID: ${config.skyflow.vaultId}`);
  console.log(`   Vault URL: ${config.skyflow.vaultUrl}\n`);

  // Initialize Skyflow client
  const skyflowClient = Skyflow.init({
    vaultID: config.skyflow.vaultId,
    vaultURL: config.skyflow.vaultUrl,
    getBearerToken: async () => {
      if (config.skyflow.apiKey) {
        return config.skyflow.apiKey;
      }
      const credentials = JSON.parse(config.skyflow.serviceAccount);
      const { generateBearerToken } = require('skyflow-node');
      const response = await generateBearerToken(credentials);
      return response.accessToken;
    },
  });

  console.log('📤 Inserting patient records into Skyflow vault...\n');

  const tokenMap: Record<string, any> = {};

  for (const patient of patientRecords) {
    console.log(`   Inserting patient ${patient.patient_id}: ${patient.patient_name}`);

    try {
      const response = await skyflowClient.insert({
        records: [
          {
            table: 'patients',
            fields: {
              patient_name: patient.patient_name,
              ssn: patient.ssn,
              date_of_birth: patient.date_of_birth,
              diagnosis: patient.diagnosis,
              medications: patient.medications,
              insurance_id: patient.insurance_id,
            },
          },
        ],
      });

      const inserted = response.records[0];
      tokenMap[patient.patient_id] = {
        skyflow_id: inserted.skyflow_id,
        patient_name_token: inserted.fields.patient_name,
        ssn_token: inserted.fields.ssn,
        date_of_birth_token: inserted.fields.date_of_birth,
        diagnosis_token: inserted.fields.diagnosis,
        medications_token: inserted.fields.medications,
        insurance_id_token: inserted.fields.insurance_id,
      };

      console.log(`   ✅ Inserted! Skyflow ID: ${inserted.skyflow_id}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to insert ${patient.patient_id}:`, error.message || error);
    }
  }

  // Save tokens to file
  const tokensPath = path.join(__dirname, '..', 'tokens.json');
  fs.writeFileSync(tokensPath, JSON.stringify(tokenMap, null, 2));

  console.log(`\n💾 Tokens saved to: tokens.json`);
  console.log('\n✨ Setup complete! Here are your tokens:\n');
  console.log(JSON.stringify(tokenMap, null, 2));

  console.log('\n📋 Next steps:');
  console.log('   1. View your data in Skyflow Studio (only you can see the real values)');
  console.log('   2. Run the demo: npm run demo');
  console.log('   3. Notice that the protected agent only has access to tokens!');
}

setupVault().catch(console.error);
