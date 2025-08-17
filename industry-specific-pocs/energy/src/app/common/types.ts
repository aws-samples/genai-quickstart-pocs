// // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// // SPDX-License-Identifier: MIT-0
// import { AwsRumConfig } from 'aws-rum-web';

// type ConsentCookie = {
//   advertising: boolean;
//   essential: boolean;
//   functional: boolean;
//   performance: boolean;
// };

// interface CookieCategories {
//   functional: boolean;
// }

// interface ShortbreadParams {
//   domain: string;
//   onConsentChanged: (cookieCategories: CookieCategories) => void;
// }
// export interface CookieConsent {
//   checkForCookieConsent: () => void;
//   getConsentCookie: () => ConsentCookie;
// }

// export interface RumOptions {
//   appId: string;
//   region: string;
//   config: AwsRumConfig;
// }

// declare global {
//   interface Window {
//     AWSCShortbread: (shortbreadParams: ShortbreadParams) => CookieConsent;
//     AWSUiConsent: CookieConsent;
//   }
// }
