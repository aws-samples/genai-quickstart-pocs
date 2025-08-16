import mysql from 'mysql2/promise';

export const handler = async (event) => {
  const query = event.query || 'SELECT 1';
  
  try {
    // Connect through RDS Proxy (no Secrets Manager needed - proxy handles auth)
    const connection = await mysql.createConnection({
      host: 'proxy-1755035367577-ab-3.proxy-cdsjk2pwupjp.us-east-1.rds.amazonaws.com',
      user: 'tonytrev',
      password: 'A01shrugged', // Proxy uses the secret automatically
      database: 'investment_db',
      port: 3306
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