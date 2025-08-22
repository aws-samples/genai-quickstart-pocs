// Generate a 33-character session ID with userName as prefix (spaces stripped) separated by hyphen
export const generateSessionId = (userName: string): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  // Strip spaces from userName and use as prefix, truncate if too long
  const cleanUserName = userName.replace(/\s+/g, '');
  const prefix = cleanUserName.substring(0, Math.min(cleanUserName.length, 15)); // Leave room for hyphen and random part
  
  // Calculate remaining length after prefix and hyphen
  const remainingLength = 33 - prefix.length - 1; // -1 for the hyphen
  
  let randomSuffix = '';
  for (let i = 0; i < remainingLength; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Combine with single hyphen
  const sessionId = prefix + '-' + randomSuffix;
  
  // Ensure exactly 33 characters
  if (sessionId.length !== 33) {
    console.warn(`Session ID length is ${sessionId.length}, expected 33. Adjusting...`);
    if (sessionId.length < 33) {
      // Pad the random suffix with more characters
      const padding = 33 - sessionId.length;
      for (let i = 0; i < padding; i++) {
        randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return prefix + '-' + randomSuffix;
    } else {
      // Truncate to 33 characters (shouldn't happen with our logic)
      return sessionId.substring(0, 33);
    }
  }
  
  return sessionId;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
