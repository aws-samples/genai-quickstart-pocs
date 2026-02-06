const { QConnectClient, UpdateSessionDataCommand } = require('@aws-sdk/client-qconnect');
const { ConnectClient, DescribeContactCommand } = require('@aws-sdk/client-connect');

const qConnectClient = new QConnectClient();
const connectClient = new ConnectClient({ region: process.env.AWS_REGION });

const ContextKeys = {
  AI_ASSISTANT_ID: 'AI_ASSISTANT_ID',
  CONNECT_INSTANCE_ID: 'CONNECT_INSTANCE_ID',
};

const log = (level, message, data) => {
  const logEntry = { level, message };
  if (data) logEntry.params = data;
  console.log(JSON.stringify(logEntry));
};

const getAssistantSessionArn = async (contactId, connectInstanceId) => {
  const command = new DescribeContactCommand({
    ContactId: contactId,
    InstanceId: connectInstanceId,
  });

  const response = await connectClient.send(command);

  if (!response.Contact?.WisdomInfo?.SessionArn) {
    throw new Error(`No wisdom session found for contact ${contactId}.`);
  }

  return response.Contact.WisdomInfo.SessionArn;
};

const getParameterFromEventOrEnvironmentVariables = (contextKey, connectRequest) => {
  const value = connectRequest.Details.Parameters[contextKey] ?? process.env[contextKey];

  if (!value) {
    throw new Error(`No ${contextKey} found in context`);
  }
  return value;
};

const getKeyValuePairs = (connectRequest) => {
  const parameters = connectRequest.Details.Parameters;
  const keyValuePairs = [];

  // Reserved parameter names that should not be added to session data
  const reservedKeys = ['AI_ASSISTANT_ID', 'CONNECT_INSTANCE_ID'];

  // Convert all parameters to key-value pairs
  for (const [key, value] of Object.entries(parameters)) {
    if (!reservedKeys.includes(key) && value) {
      keyValuePairs.push({
        key: key,
        value: {
          stringValue: String(value),
        },
      });
    }
  }

  return keyValuePairs;
};

const updateSessionData = async (aiAssistantId, assistantSessionId, keyValuePairs) => {
  const command = new UpdateSessionDataCommand({
    assistantId: aiAssistantId,
    sessionId: assistantSessionId,
    data: keyValuePairs,
  });

  log('INFO', 'updateSessionCommand', command);
  await qConnectClient.send(command);
};

exports.handler = async (connectRequest) => {
  log('INFO', 'Event', connectRequest);
  const contactId = connectRequest.Details.ContactData.ContactId;

  const aiAssistantId = getParameterFromEventOrEnvironmentVariables(
    ContextKeys.AI_ASSISTANT_ID,
    connectRequest,
  );

  if (!contactId || !aiAssistantId) {
    const errorMessage = 'Missing required parameters contactId or ai assistantid';
    log('ERROR', errorMessage);
    throw new Error(errorMessage);
  }

  const keyValuePairs = getKeyValuePairs(connectRequest);

  if (keyValuePairs.length === 0) {
    const errorMessage = 'No key value pairs found';
    log('ERROR', errorMessage);
    throw new Error(errorMessage);
  }

  log('INFO', 'KVPs', keyValuePairs);

  const connectId = process.env[ContextKeys.CONNECT_INSTANCE_ID];

  if (!connectId) {
    throw new Error('No connect instance id found in environment variables');
  }

  const assistantSessionArn = await getAssistantSessionArn(contactId, connectId);
  await updateSessionData(aiAssistantId, assistantSessionArn, keyValuePairs);

  const lambdaResponse = {
    statusCode: 200,
  };

  log('DEBUG', 'Lambda response', lambdaResponse);
  return lambdaResponse;
};
