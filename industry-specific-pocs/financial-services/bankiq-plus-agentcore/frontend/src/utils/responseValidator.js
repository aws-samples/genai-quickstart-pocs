/**
 * Validates and normalizes agent responses
 */

export const ResponseValidator = {
  /**
   * Validate peer analysis response structure
   */
  validatePeerAnalysis(response) {
    const issues = [];
    
    if (!response) {
      issues.push('Response is null or undefined');
      return { valid: false, issues };
    }

    if (!response.result) {
      issues.push('Missing result object');
    }

    if (response.result && !Array.isArray(response.result.data)) {
      issues.push('result.data is not an array');
    }

    if (response.result && response.result.data) {
      response.result.data.forEach((item, index) => {
        if (!item.Bank) issues.push(`Item ${index}: Missing Bank field`);
        if (!item.Quarter) issues.push(`Item ${index}: Missing Quarter field`);
        if (!item.Metric) issues.push(`Item ${index}: Missing Metric field`);
        if (typeof item.Value !== 'number') issues.push(`Item ${index}: Value is not a number`);
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      dataPoints: response.result?.data?.length || 0
    };
  },

  /**
   * Validate FDIC data response
   */
  validateFDICData(response) {
    const issues = [];

    if (!response || !response.result) {
      issues.push('Missing result structure');
      return { valid: false, issues };
    }

    if (!Array.isArray(response.result.data)) {
      issues.push('result.data is not an array');
    }

    return {
      valid: issues.length === 0,
      issues,
      recordCount: response.result?.data?.length || 0
    };
  },

  /**
   * Validate SEC filings response
   */
  validateSECFilings(response) {
    const issues = [];

    if (!response) {
      issues.push('Response is null');
      return { valid: false, issues };
    }

    if (!response['10-K'] && !response['10-Q']) {
      issues.push('Missing both 10-K and 10-Q arrays');
    }

    if (response['10-K'] && !Array.isArray(response['10-K'])) {
      issues.push('10-K is not an array');
    }

    if (response['10-Q'] && !Array.isArray(response['10-Q'])) {
      issues.push('10-Q is not an array');
    }

    return {
      valid: issues.length === 0,
      issues,
      tenKCount: response['10-K']?.length || 0,
      tenQCount: response['10-Q']?.length || 0
    };
  },

  /**
   * Validate PDF upload response
   */
  validatePDFUpload(response) {
    const issues = [];

    if (!response || !response.success) {
      issues.push('Upload not successful');
    }

    if (!response.documents || !Array.isArray(response.documents)) {
      issues.push('Missing or invalid documents array');
    }

    if (response.documents) {
      response.documents.forEach((doc, index) => {
        if (!doc.bank_name) issues.push(`Doc ${index}: Missing bank_name`);
        if (!doc.form_type) issues.push(`Doc ${index}: Missing form_type`);
        if (!doc.year) issues.push(`Doc ${index}: Missing year`);
        if (!doc.s3_key) issues.push(`Doc ${index}: Missing s3_key`);
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      documentCount: response.documents?.length || 0,
      method: response.method || 'unknown'
    };
  }
};

/**
 * Log validation results to console
 */
export function logValidation(name, validation) {
  if (validation.valid) {
    console.log(`✅ ${name} validation passed`, validation);
  } else {
    console.error(`❌ ${name} validation failed:`, validation.issues);
  }
  return validation.valid;
}
