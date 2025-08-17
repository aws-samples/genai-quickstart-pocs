// // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// // SPDX-License-Identifier: MIT-0
// import { AwsRum } from 'aws-rum-web';

// import { RumOptions } from './types';

// const DEFAULT_RUM_OPTIONS: RumOptions = {
//   appId: '',
//   config: {},
//   region: '',
// };

// const parseRumOptions = (rumOptions: RumOptions): RumOptions | undefined => {
//   try {
//     rumOptions.config.userIdRetentionDays = 1;
//     rumOptions.config.sessionLengthSeconds = 60 * 60 * 24; // 24hours
//     // We setup telemetries manually as this configuration isn't passed from the CDK
//     rumOptions.config.telemetries = [
//       [
//         'errors',
//         {
//           // Increase stackTrace from default 200
//           stackTraceLength: 500,
//           ignore: (errorEvent: Error) => {
//             // This function should return a value that coerces to true when the error should be ignored
//             // We currently ignore the benign ResizeObserver error and the playground errors (errors include "@babel/template")
//             return errorEvent && errorEvent.message && !!errorEvent.message.match(/^ResizeObserver|@babel\/template/);
//           },
//         },
//       ],
//       'performance',
//       [
//         'http',
//         {
//           stackTraceLength: 500,
//         },
//       ],
//     ];
//     return rumOptions;
//   } catch (error) {
//     // Don't log "error" to avoid leaking configuration details
//     // eslint-disable-next-line no-console
//     console.error('Error parsing RUM config');
//   }
// };

// const initRum = (options?: RumOptions) => {
//   try {
//     if (options === undefined) {
//       throw new Error('No RUM options are provided');
//     }

//     const { appId, region, config } = options;
//     // Initialize CloudWatch RUM Analytics
//     const appVersion = '1.0.0';
//     const rum = new AwsRum(appId, appVersion, region, config);

//     rum.setAwsCredentials({
//       accessKeyId: 'unauthenticated',
//       secretAccessKey: 'unauthenticated',
//     });

//     return rum;
//   } catch (error) {
//     // Don't log error to not leak information
//     // eslint-disable-next-line no-console
//     console.log('Error initializing RUM');
//   }
// };

// function initConsent(rum: RumOptions) {
//   const rumOptions = parseRumOptions(rum);

//   let rumClient: AwsRum | undefined;

//   // Init Shortbread script
//   window.AwsUiConsent = window.AWSCShortbread({
//     domain: window.location.hostname,
//     onConsentChanged: cookieCategories => {
//       if (!rumOptions) {
//         return;
//       }
//       //  The cookie categories are "essential" | "performance" | "functional" | "advertising"
//       //  RUM depends on the "functional" cookies consent
//       if (rumClient) {
//         rumClient.allowCookies(cookieCategories.functional);
//       } else {
//         rumOptions.config.allowCookies = cookieCategories.functional;
//         rumClient = initRum(rumOptions);
//       }
//     },
//   });
//   window.AwsUiConsent.checkForCookieConsent();
// }

// function waitForShortbread() {
//   if (typeof window.AWSCShortbread === 'undefined' && process.env.EXTERNAL_SITE) {
//     setTimeout(waitForShortbread, 1000);
//     return;
//   }

//   if (document.location.origin === 'https://cloudscape.design') {
//     // this file is created in AWS-UI-Website package
//     fetch('/examples/rum-config.json', { credentials: 'include' })
//       .then(response => response.json())
//       .then(initConsent)
//       .catch(() => {
//         initConsent(DEFAULT_RUM_OPTIONS);
//       });
//   } else if (
//     document.location.origin === 'https://cloudscape.aws.dev' ||
//     document.location.origin === 'https://classic.cloudscape.aws.dev' ||
//     document.location.origin === 'https://refresh.cloudscape.aws.dev'
//   ) {
//     // this file is created in AWS-UI-Website package
//     fetch('/examples/rum-config.json', { credentials: 'include' })
//       .then(response => response.json())
//       .then(config => initRum(parseRumOptions(config)));
//   }
// }

// waitForShortbread();
