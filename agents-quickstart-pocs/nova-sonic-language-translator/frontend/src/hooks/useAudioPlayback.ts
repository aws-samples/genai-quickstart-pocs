import { useRef, useState, useCallback, useEffect } from 'react';

interface UseAudioPlaybackReturn {
  queueAudio: (audioData: string) => void;
  stopPlayback: () => void;
  isPlaying: boolean;
  queueLength: number;
}

/**
 * Custom hook for decoding and playing received audio data
 * 
 * Features:
 * - Creates AudioContext with 24kHz sample rate
 * - Maintains queue of audio buffers
 * - Decodes base64 audio to PCM Int16 to Float32
 * - Schedules sequential playback without gaps
 * - Resumes AudioContext if suspended
 */
export function useAudioPlayback(): UseAudioPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  /**
   * Initialize AudioContext with 24kHz sample rate
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      // Create AudioContext with 24kHz sample rate for playback
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0;
      console.log('AudioContext created with 24kHz sample rate');
    }

    // Resume AudioContext if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      console.log('AudioContext resumed');
    }

    return audioContextRef.current;
  }, []);

  /**
   * Decode base64 audio data to Float32Array
   * Converts: base64 -> binary -> PCM Int16 -> Float32
   */
  const decodeAudio = useCallback((base64Data: string): Float32Array => {
    // Decode base64 to binary string
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert Uint8Array to Int16Array (PCM format)
    const int16Array = new Int16Array(bytes.buffer);

    // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    return float32Array;
  }, []);

  /**
   * Create AudioBuffer from decoded Float32 audio data
   */
  const createAudioBuffer = useCallback(
    (audioContext: AudioContext, audioData: Float32Array): AudioBuffer => {
      // Create AudioBuffer with decoded data
      const buffer = audioContext.createBuffer(
        1, // mono channel
        audioData.length,
        audioContext.sampleRate
      );

      // Get channel data and copy audio data to buffer
      const channelData = buffer.getChannelData(0);
      channelData.set(audioData);

      return buffer;
    },
    []
  );

  /**
   * Schedule audio buffer for playback without gaps
   */
  const schedulePlayback = useCallback(
    (audioContext: AudioContext, buffer: AudioBuffer): void => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      // Calculate start time to avoid gaps
      const startTime = Math.max(
        audioContext.currentTime,
        nextPlayTimeRef.current
      );

      // Schedule playback
      source.start(startTime);

      // Update next play time to end of this buffer
      nextPlayTimeRef.current = startTime + buffer.duration;

      // Mark as playing
      setIsPlaying(true);

      // Handle playback end
      source.onended = () => {
        // Check if we're at the end of the queue
        if (audioQueueRef.current.length === 0 && !isProcessingRef.current) {
          setIsPlaying(false);
          nextPlayTimeRef.current = 0;
        }
      };

      console.log(
        `Scheduled playback at ${startTime.toFixed(3)}s, duration: ${buffer.duration.toFixed(3)}s`
      );
    },
    []
  );

  /**
   * Process audio queue and schedule playback
   */
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const audioContext = getAudioContext();

      // Process all queued buffers
      while (audioQueueRef.current.length > 0) {
        const buffer = audioQueueRef.current.shift();
        if (buffer) {
          schedulePlayback(audioContext, buffer);
          setQueueLength(audioQueueRef.current.length);
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [getAudioContext, schedulePlayback]);

  /**
   * Queue audio data for playback
   */
  const queueAudio = useCallback(
    (audioData: string) => {
      // Check for clear queue signal
      if (audioData === '__CLEAR_QUEUE__') {
        console.log('🛑 Clearing audio queue due to barge-in');
        stopPlayback();
        return;
      }

      try {
        const audioContext = getAudioContext();

        // Decode audio data
        const decodedData = decodeAudio(audioData);

        // Create audio buffer
        const buffer = createAudioBuffer(audioContext, decodedData);

        // Add to queue
        audioQueueRef.current.push(buffer);
        setQueueLength(audioQueueRef.current.length);

        console.log(
          `Audio queued: ${buffer.duration.toFixed(3)}s, queue length: ${audioQueueRef.current.length}`
        );

        // Process queue
        processQueue();
      } catch (error) {
        console.error('Failed to queue audio:', error);
      }
    },
    [getAudioContext, decodeAudio, createAudioBuffer, processQueue]
  );

  /**
   * Stop playback and clear queue
   */
  const stopPlayback = useCallback(() => {
    // Clear audio queue
    audioQueueRef.current = [];
    setQueueLength(0);

    // Reset play time
    nextPlayTimeRef.current = 0;

    // Suspend AudioContext instead of closing (so we can resume)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend();
    }

    setIsPlaying(false);
    console.log('Playback stopped and queue cleared');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    queueAudio,
    stopPlayback,
    isPlaying,
    queueLength,
  };
}
