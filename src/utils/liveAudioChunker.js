/**
 * Live Audio Chunker for Near-Real-Time Speech-to-Text Transcription with Groq Whisper.
 *
 * Captures browser microphone audio in continuous 3.5-second chunks as 16kHz mono WAV,
 * runs Voice Activity Detection (RMS threshold) to avoid transcribing pure silence,
 * and encodes to Base64 for immediate WebSocket transmission to the backend.
 *
 * Universal browser compatibility:
 * - Chrome, Edge, Firefox, Safari iOS/macOS.
 * - Primary: Web Audio API (ScriptProcessor + 16kHz PCM WAV encoding).
 * - Fallback: MediaRecorder standalone cycles.
 */

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Downsamples Float32Array from inputSampleRate down to 16,000 Hz.
 */
function downsampleTo16kHz(buffer, inputSampleRate) {
  if (inputSampleRate === 16000) {
    return buffer;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Encodes Float32 mono samples into a standard 16-bit PCM WAV ArrayBuffer.
 */
function encodeWAV(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');

  // FMT sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate (16000)
  view.setUint32(28, sampleRate * 2, true); // ByteRate (16000 * 1 * 2)
  view.setUint16(32, 2, true); // BlockAlign (1 * 2)
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // DATA sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Convert Float32 [-1.0, 1.0] to 16-bit signed PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Converts ArrayBuffer to Base64 string.
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Creates and initializes a LiveAudioChunker instance.
 *
 * @param {Object} options
 * @param {MediaStream} options.stream - Local microphone MediaStream
 * @param {string} options.participant - 'doctor' or 'patient'
 * @param {string} options.meetingId - Current meeting ID
 * @param {Function} options.onChunk - Callback receiving chunk payload
 * @param {number} [options.chunkDurationMs=3500] - Duration of each chunk in ms (3-5s)
 * @param {number} [options.minRmsThreshold=0.002] - Energy threshold to skip pure silence
 */
export function createLiveAudioChunker({
  stream,
  participant = 'patient',
  meetingId,
  onChunk,
  chunkDurationMs = 3500,
  minRmsThreshold = 0.002,
}) {
  let isRunning = false;
  let isMuted = false;
  let sequence = 0;
  let audioContext = null;
  let mediaStreamSource = null;
  let processorNode = null;
  let audioSamplesBuffer = [];
  let bufferSampleCount = 0;
  let chunkTimer = null;
  const startTime = Date.now();

  const audioTrack = stream?.getAudioTracks()[0];
  if (!audioTrack) {
    console.warn(`[TRANSCRIPTION] participant=${participant} — No audio track found in stream`);
    return null;
  }

  console.log(
    `[TRANSCRIPTION_INIT] participant=${participant} track_label="${audioTrack.label}" ` +
    `enabled=${audioTrack.enabled} readyState=${audioTrack.readyState}`
  );

  function flushChunk() {
    if (!isRunning || isMuted) {
      audioSamplesBuffer = [];
      bufferSampleCount = 0;
      return;
    }

    if (bufferSampleCount === 0) return;

    // Concatenate collected Float32 audio blocks
    const totalSamples = bufferSampleCount;
    const mergedSamples = new Float32Array(totalSamples);
    let offset = 0;
    for (const block of audioSamplesBuffer) {
      mergedSamples.set(block, offset);
      offset += block.length;
    }

    // Reset buffer
    audioSamplesBuffer = [];
    bufferSampleCount = 0;

    // Downsample to 16kHz if necessary
    const currentSampleRate = audioContext?.sampleRate || 16000;
    const samples16k = downsampleTo16kHz(mergedSamples, currentSampleRate);

    // Compute RMS energy (Voice Activity Detection)
    let sumSquares = 0;
    for (let i = 0; i < samples16k.length; i++) {
      sumSquares += samples16k[i] * samples16k[i];
    }
    const rms = Math.sqrt(sumSquares / samples16k.length);

    // Skip sending if audio is near pure silence
    if (rms < minRmsThreshold) {
      return;
    }

    // Encode to 16kHz mono WAV
    const wavBuffer = encodeWAV(samples16k, 16000);
    const audioBase64 = arrayBufferToBase64(wavBuffer);
    const timestampSec = Math.max(0, (Date.now() - startTime) / 1000);

    sequence++;

    console.log(
      `[TRANSCRIPTION] participant=${participant} audio_track=${audioTrack.readyState} ` +
      `chunk_size=${wavBuffer.byteLength} chunk_sequence=${sequence} rms=${rms.toFixed(4)}`
    );

    if (typeof onChunk === 'function') {
      onChunk({
        type: 'audio_chunk',
        meeting_id: meetingId,
        participant,
        sequence,
        timestamp: parseFloat(timestampSec.toFixed(2)),
        mime_type: 'audio/wav',
        audio_base64: audioBase64,
      });
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('AudioContext not supported');
      }

      // Try 16kHz context; browser falls back gracefully to hardware rate
      audioContext = new AudioCtx({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      mediaStreamSource = audioContext.createMediaStreamSource(stream);

      // ScriptProcessor captures raw PCM frames (buffer size 4096 gives ~85ms updates at 48kHz)
      processorNode = audioContext.createScriptProcessor(4096, 1, 1);

      processorNode.onaudioprocess = (e) => {
        if (!isRunning || isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Clone input block
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);
        audioSamplesBuffer.push(copy);
        bufferSampleCount += copy.length;
      };

      mediaStreamSource.connect(processorNode);
      // Connect processor to destination so Chrome/Safari does not garbage collect it
      // Connect to a silent gain node to prevent local feedback/echo
      const silenceGain = audioContext.createGain();
      silenceGain.gain.value = 0;
      processorNode.connect(silenceGain);
      silenceGain.connect(audioContext.destination);

      // Flush chunks every chunkDurationMs (e.g. 3500ms)
      chunkTimer = setInterval(flushChunk, chunkDurationMs);

      console.log(
        `[AUDIO_CHUNKER_RUNNING] participant=${participant} sampleRate=${audioContext.sampleRate} ` +
        `interval=${chunkDurationMs}ms`
      );
    } catch (err) {
      console.warn(`[AUDIO_CHUNKER_WARN] Web Audio failed, falling back to MediaRecorder:`, err);
      startMediaRecorderFallback();
    }
  }

  // Fallback: standalone MediaRecorder chunks if Web Audio API is blocked
  let fallbackRecorder = null;
  function startMediaRecorderFallback() {
    try {
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recordCycle = () => {
        if (!isRunning || isMuted) return;
        try {
          const rec = new MediaRecorder(new MediaStream([audioTrack]), mimeType ? { mimeType } : undefined);
          let blobData = null;

          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 200) {
              blobData = e.data;
            }
          };

          rec.onstop = async () => {
            if (blobData && blobData.size > 200 && isRunning && !isMuted) {
              sequence++;
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                const timestampSec = Math.max(0, (Date.now() - startTime) / 1000);
                console.log(
                  `[TRANSCRIPTION] participant=${participant} audio_track=${audioTrack.readyState} ` +
                  `chunk_size=${blobData.size} chunk_sequence=${sequence} (fallback)`
                );
                if (typeof onChunk === 'function') {
                  onChunk({
                    type: 'audio_chunk',
                    meeting_id: meetingId,
                    participant,
                    sequence,
                    timestamp: parseFloat(timestampSec.toFixed(2)),
                    mime_type: mimeType,
                    audio_base64: base64,
                  });
                }
              };
              reader.readAsDataURL(blobData);
            }
            if (isRunning) {
              recordCycle();
            }
          };

          rec.start();
          fallbackRecorder = rec;
          setTimeout(() => {
            if (rec.state === 'recording') {
              rec.stop();
            }
          }, chunkDurationMs);
        } catch (cycleErr) {
          console.error('[AUDIO_CHUNKER_FALLBACK_ERROR]', cycleErr);
        }
      };

      recordCycle();
    } catch (fallbackErr) {
      console.error('[AUDIO_CHUNKER_FALLBACK_FAILED]', fallbackErr);
    }
  }

  function stop() {
    isRunning = false;
    if (chunkTimer) {
      clearInterval(chunkTimer);
      chunkTimer = null;
    }
    if (processorNode) {
      try {
        processorNode.disconnect();
      } catch (e) {}
      processorNode = null;
    }
    if (mediaStreamSource) {
      try {
        mediaStreamSource.disconnect();
      } catch (e) {}
      mediaStreamSource = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (e) {}
      audioContext = null;
    }
    if (fallbackRecorder && fallbackRecorder.state !== 'inactive') {
      try {
        fallbackRecorder.stop();
      } catch (e) {}
      fallbackRecorder = null;
    }
    audioSamplesBuffer = [];
    bufferSampleCount = 0;
    console.log(`[AUDIO_CHUNKER_STOPPED] participant=${participant} total_chunks=${sequence}`);
  }

  function setMuted(muted) {
    isMuted = !!muted;
    if (isMuted) {
      audioSamplesBuffer = [];
      bufferSampleCount = 0;
    }
    console.log(`[AUDIO_CHUNKER_MUTE] participant=${participant} muted=${isMuted}`);
  }

  return {
    start,
    stop,
    setMuted,
    isMuted: () => isMuted,
  };
}
