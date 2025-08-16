import mysql from 'mysql2/promise';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

export const handler = async (event) => {
  const query = event.query || 'SELECT 1';
  
  try {
    // Get database credentials and proxy endpoint from Secrets Manager
    const secretName = 'MsSQLConnect-SM';
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const secretResponse = await secretsClient.send(command);
    
    if (!secretResponse.SecretString) {
      throw new Error('Secret not found or empty');
    }
    
    const secret = JSON.parse(secretResponse.SecretString);
  

    // Connect using proxy endpoint and credentials from secret
    const connection = await mysql.createConnection({
      host: secret.proxy,
      user: secret.username,
      password: secret.password,
      database: secret.dbname,
      port: secret.port || 3306
    });

    const [rows] = await connection.execute(query);
    await connection.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        query: query,
        data: rows
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
