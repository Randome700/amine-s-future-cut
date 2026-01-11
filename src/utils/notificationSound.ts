// This file generates and exports a notification sound as a data URL
// Uses the Web Audio API to create a pleasant notification chime

export const createNotificationSound = (): string => {
  // Create a simple audio context to generate a notification sound
  const sampleRate = 44100;
  const duration = 0.3;
  const numSamples = Math.floor(sampleRate * duration);
  
  // Create WAV file header and data
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Generate a pleasant chime sound
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Two-tone chime
    const freq1 = 880; // A5
    const freq2 = 1320; // E6
    const envelope = Math.exp(-t * 10);
    const sample = envelope * (
      Math.sin(2 * Math.PI * freq1 * t) * 0.5 +
      Math.sin(2 * Math.PI * freq2 * t) * 0.3
    );
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, int16, true);
  }
  
  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return 'data:audio/wav;base64,' + btoa(binary);
};

export const notificationSoundUrl = createNotificationSound();
