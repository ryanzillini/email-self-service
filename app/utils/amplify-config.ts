'use client';

import { Amplify } from 'aws-amplify';
import config from '../../amplify_outputs.json';

// Configure Amplify once in a centralized location
Amplify.configure(config, {
  ssr: true
});

// Export a function that does nothing but can be imported
// to ensure this file is included in the bundle
export function ensureAmplifyConfigured() {
  // Configuration already done when this file is imported
  return true;
} 