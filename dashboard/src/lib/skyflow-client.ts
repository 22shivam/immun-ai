import { config } from './config';

// Skyflow SDK
const { Skyflow, generateBearerToken } = require('skyflow-node');

export interface PatientRecord {
  skyflow_id?: string;
  patient_name: string;
  ssn: string;
  date_of_birth: string;
  diagnosis: string;
  medications: string;
  insurance_id: string;
}

export interface TokenizedPatientRecord {
  skyflow_id: string;
  patient_name: string;  // token
  ssn: string;           // token
  date_of_birth: string; // token
  diagnosis: string;     // token
  medications: string;   // token
  insurance_id: string;  // token
}

let skyflowClient: any = null;

function getClient() {
  if (skyflowClient) return skyflowClient;

  const credentials = config.skyflow.apiKey
    ? { apiKey: config.skyflow.apiKey }
    : JSON.parse(config.skyflow.serviceAccount);

  skyflowClient = Skyflow.init({
    vaultID: config.skyflow.vaultId,
    vaultURL: config.skyflow.vaultUrl,
    getBearerToken: async () => {
      // If using API key, this returns a bearer token
      if (config.skyflow.apiKey) {
        return config.skyflow.apiKey;
      }
      // For service account, use the SDK's built-in token generation
      const { generateBearerToken } = require('skyflow-node');
      const response = await generateBearerToken(credentials);
      return response.accessToken;
    },
  });

  return skyflowClient;
}

export async function insertPatientRecord(record: PatientRecord): Promise<TokenizedPatientRecord> {
  const client = getClient();

  const response = await client.insert({
    records: [
      {
        table: 'patients',
        fields: {
          patient_name: record.patient_name,
          ssn: record.ssn,
          date_of_birth: record.date_of_birth,
          diagnosis: record.diagnosis,
          medications: record.medications,
          insurance_id: record.insurance_id,
        },
      },
    ],
  });

  const inserted = response.records[0];
  return {
    skyflow_id: inserted.skyflow_id,
    patient_name: inserted.fields.patient_name,
    ssn: inserted.fields.ssn,
    date_of_birth: inserted.fields.date_of_birth,
    diagnosis: inserted.fields.diagnosis,
    medications: inserted.fields.medications,
    insurance_id: inserted.fields.insurance_id,
  };
}

export async function detokenize(tokens: string[]): Promise<Record<string, string>> {
  const client = getClient();

  const response = await client.detokenize({
    records: tokens.map((token) => ({
      token,
      redaction: 'PLAIN_TEXT',
    })),
  });

  const result: Record<string, string> = {};
  response.records.forEach((record: any, index: number) => {
    result[tokens[index]] = record.value;
  });

  return result;
}

export async function getPatientByToken(
  tokenizedRecord: TokenizedPatientRecord
): Promise<PatientRecord> {
  const tokens = [
    tokenizedRecord.patient_name,
    tokenizedRecord.ssn,
    tokenizedRecord.date_of_birth,
    tokenizedRecord.diagnosis,
    tokenizedRecord.medications,
    tokenizedRecord.insurance_id,
  ];

  const detokenized = await detokenize(tokens);

  return {
    skyflow_id: tokenizedRecord.skyflow_id,
    patient_name: detokenized[tokenizedRecord.patient_name],
    ssn: detokenized[tokenizedRecord.ssn],
    date_of_birth: detokenized[tokenizedRecord.date_of_birth],
    diagnosis: detokenized[tokenizedRecord.diagnosis],
    medications: detokenized[tokenizedRecord.medications],
    insurance_id: detokenized[tokenizedRecord.insurance_id],
  };
}
