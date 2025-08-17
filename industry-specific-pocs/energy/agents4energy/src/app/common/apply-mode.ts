// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { applyDensity, Density } from '@cloudscape-design/global-styles';

// import * as localStorage from './localStorage';

import '@cloudscape-design/global-styles/index.css';

// (window as any).disableMotionForTests = disableMotion;

// always `true` in this design
export const isVisualRefresh = true;

export let currentDensity: Density = localStorage.load('Awsui-Density-Preference') ?? Density.Comfortable;
applyDensity(currentDensity);

export function updateDensity(density: string) {
  applyDensity(density as Density);
  localStorage.save('Awsui-Density-Preference', density);
  currentDensity = density as Density;
}
