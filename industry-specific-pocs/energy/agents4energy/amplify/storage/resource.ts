import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'fileDrive',
  access: (allow) => ({
    'production-agent/*': [
      allow.authenticated.to(['read']),
    ],
    'maintenance-agent/*': [
      allow.authenticated.to(['read']),
    ],
    'petrophysics-agent/*': [
      allow.authenticated.to(['read']),
    ],
    'regulatory-agent/*': [
      allow.authenticated.to(['read'])
    
    ],
  })
});