import mysql from 'mysql2/promise';

// NOTE: Environment variables must be added manually in Lambda Console:
// DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
// Go to Lambda Console → Configuration → Environment variables → Edit

export const handler = async (event) => {
  console.log('Lambda started, event:', JSON.stringify(event));
  
  const query = event.query || 'SELECT 1';
  console.log('Query to execute:', query);
  
  try {
    // Validate environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    console.log('Connecting to database via proxy:', process.env.DB_HOST);
    
    // Connect using environment variables
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
    });

    console.log('Connected successfully, executing query...');
    const [rows] = await connection.execute(query);
    console.log('Query executed, rows returned:', Array.isArray(rows) ? rows.length : 'unknown');
    
    await connection.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        query: query,
        data: rows
      })
    };
  } catch (error) {
    console.error('Lambda error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Unknown error',
        errorType: error.constructor.name,
        stack: error.stack
      })
    };
  }
};
