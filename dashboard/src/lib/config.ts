import dotenv from 'dotenv';
dotenv.config();

export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  skyflow: {
    vaultId: process.env.SKYFLOW_VAULT_ID || '',
    vaultUrl: process.env.SKYFLOW_VAULT_URL || '',
    clusterId: process.env.SKYFLOW_VAULT_URL?.match(/https:\/\/([^.]+)/)?.[1] || '',
    apiKey: process.env.SKYFLOW_API_KEY || '',
    serviceAccount: process.env.SKYFLOW_SERVICE_ACCOUNT || '',
  },
};

export function validateConfig(): void {
  if (!config.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }
  if (!config.skyflow.vaultId) {
    throw new Error('SKYFLOW_VAULT_ID is required');
  }
  if (!config.skyflow.vaultUrl) {
    throw new Error('SKYFLOW_VAULT_URL is required');
  }
  if (!config.skyflow.apiKey && !config.skyflow.serviceAccount) {
    throw new Error('Either SKYFLOW_API_KEY or SKYFLOW_SERVICE_ACCOUNT is required');
  }
}
