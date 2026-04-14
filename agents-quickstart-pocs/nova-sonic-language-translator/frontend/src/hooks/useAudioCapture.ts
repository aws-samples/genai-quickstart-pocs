import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioCaptureConfig {
  enabled: boolean;
  onAudioData: (audioData: string) => void;
  sampleRate?: number;
}

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  error: string | null;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
}

/**
 * Custom hook for capturing microphone audio and encoding to PCM format
 * 
 * Features:
 * - Requests microphone access with echo cancellation and noise suppression
 * - Resamples audio to target sample rate (default 16kHz)
 * - Converts Float32 audio to PCM Int16 format
 * - Base64 encodes audio data for transmission
 */
export function useAudioCapture(
  config: UseAudioCaptureConfig
): UseAudioCaptureReturn {
  const { enabled, onAudioData, sampleRate = 16000 } = config;

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);

  // Keep callback ref up to date
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  }, [onAudioData]);

  /**
   * Resample audio data from source sample rate to target sample rate
   */
  const resample = useCallback(
    (
      inputData: Float32Array,
      sourceSampleRate: number,
      targetSampleRate: number
    ): Float32Array => {
      if (sourceSampleRate === targetSampleRate) {
        return inputData;
      }

      const ratio = sourceSampleRate / targetSampleRate;
      const newLength = Math.floor(inputData.length / ratio);
      const resampledData = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        resampledData[i] = inputData[Math.floor(i * ratio)];
      }

      return resampledData;
    },
    []
  );

  /**
   * Convert Float32 audio data to PCM Int16 format and base64 encode
   */
  const encodePCM = useCallback((float32Data: Float32Array): string => {
    const int16Data = new Int16Array(float32Data.length);

    // Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    // Convert Int16Array to Uint8Array for base64 encoding
    const uint8Array = new Uint8Array(int16Data.buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }

    return btoa(binary);
  }, []);

  /**
   * Start capturing audio from microphone
   */
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access with constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create AudioContext with browser's default sample rate
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const sourceSampleRate = audioContext.sampleRate;

      // Create audio source from media stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Create ScriptProcessorNode for audio processing
      // Buffer size of 4096 provides good balance between latency and processing
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(
        bufferSize,
        1, // mono input
        1  // mono output
      );
      processorNodeRef.current = processor;

      // Process audio data
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Resample to target sample rate if needed
        const resampledData = resample(
          inputData,
          sourceSampleRate,
          sampleRate
        );

        // Encode to PCM Int16 and base64
        const encodedData = encodePCM(resampledData);

        // Send encoded audio data using ref to avoid recreating startCapture
        onAudioDataRef.current(encodedData);
      };

      // Connect nodes: source -> processor -> destination
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsCapturing(true);
      console.log(
        `Audio capture started: ${sourceSampleRate}Hz -> ${sampleRate}Hz`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      setIsCapturing(false);
      console.error('Microphone access error:', err);
    }
  }, [sampleRate, resample, encodePCM]); // Removed onAudioData from dependencies

  /**
   * Stop capturing audio and cleanup resources
   */
  const stopCapture = useCallback(() => {
    // Disconnect and cleanup processor node
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }

    // Disconnect source node
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    // Stop all media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsCapturing(false);
    console.log('Audio capture stopped');
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !isCapturing) {
      startCapture();
    } else if (!enabled && isCapturing) {
      stopCapture();
    }
  }, [enabled, isCapturing, startCapture, stopCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    isCapturing,
    error,
    startCapture,
    stopCapture,
  };
}
