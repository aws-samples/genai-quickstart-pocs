"use client"
import { Authenticator } from '@aws-amplify/ui-react';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import "@aws-amplify/ui-react-storage/styles.css";

//   import config from '../../../amplify_outputs.json';

//   Amplify.configure(config);

export const { StorageBrowser } = createStorageBrowser({
  config: createAmplifyAuthAdapter(),
});

const Page = () => (
  <Authenticator>
    <StorageBrowser />
  </Authenticator>
);

export default Page