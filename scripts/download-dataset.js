// Script to download SPML Chatbot Prompt Injection dataset from HuggingFace
const https = require('https');
const fs = require('fs');
const path = require('path');

// Download parquet file from HuggingFace
const DATASET_URL = 'https://huggingface.co/datasets/reshabhs/SPML_Chatbot_Prompt_Injection/resolve/main/data/train-00000-of-00001.parquet';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'spml-attacks.parquet');

console.log('📥 Downloading SPML Chatbot Prompt Injection dataset...');
console.log(`   Source: ${DATASET_URL}`);
console.log(`   Target: ${OUTPUT_PATH}\n`);

const file = fs.createWriteStream(OUTPUT_PATH);

https.get(DATASET_URL, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Follow redirect
    https.get(response.headers.location, (redirectResponse) => {
      const totalBytes = parseInt(redirectResponse.headers['content-length'], 10);
      let downloadedBytes = 0;

      redirectResponse.pipe(file);

      redirectResponse.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
        process.stdout.write(`\r   Progress: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
      });

      file.on('finish', () => {
        file.close();
        console.log('\n\n✅ Dataset downloaded successfully!');
        console.log(`   File size: ${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB`);
        console.log('\n💡 Next steps:');
        console.log('   1. Convert parquet to JSON: npm run convert-dataset');
        console.log('   2. Seed Redis: npm run seed-redis');
      });
    }).on('error', (err) => {
      fs.unlink(OUTPUT_PATH, () => {});
      console.error(`\n❌ Download error: ${err.message}`);
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('\n✅ Dataset downloaded!');
    });
  }
}).on('error', (err) => {
  fs.unlink(OUTPUT_PATH, () => {});
  console.error(`❌ Error: ${err.message}`);
});
