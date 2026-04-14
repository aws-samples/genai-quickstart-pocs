import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import App from './App';
import './styles/index.css';

// Configure Amplify with existing Cognito User Pool
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_eqhXbzvLQ',
      userPoolClientId: '1623qtooci4vignifsaub5l93t',
      loginWith: {
        email: true,
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Authenticator>
    <App />
  </Authenticator>
);
