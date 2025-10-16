export interface VoiceRssConfig {
  apiKey: string;
  endpoint?: string;
  language?: string;
  voice?: string;
  codec?: 'mp3' | 'wav' | 'aac' | 'ogg';
  audioFormat?: string;
  rate?: number;
}

export interface VoiceRssPlayback {
  audio: HTMLAudioElement;
  objectUrl: string;
}

const DEFAULT_ENDPOINT = 'https://api.voicerss.org/';
const DEFAULT_CODEC: VoiceRssConfig['codec'] = 'mp3';
const DEFAULT_FORMAT = '44khz_16bit_stereo';

const isTextContent = (contentType: string | null) =>
  Boolean(contentType) && /text\/(plain|html)|json/i.test(contentType ?? '');

export const createVoiceRssPlayback = async (
  text: string,
  config: VoiceRssConfig,
  signal?: AbortSignal
): Promise<VoiceRssPlayback> => {
  if (!text.trim()) {
    throw new Error('No text provided for speech synthesis.');
  }

  if (typeof fetch === 'undefined') {
    throw new Error('Fetch API is unavailable in this environment.');
  }

  const params = new URLSearchParams({
    key: config.apiKey,
    src: text,
    hl: config.language ?? 'en-us',
    c: config.codec ?? DEFAULT_CODEC,
    f: config.audioFormat ?? DEFAULT_FORMAT,
    r: String(config.rate ?? 0)
  });

  if (config.voice) {
    params.set('v', config.voice);
  }

  const response = await fetch(config.endpoint ?? DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: params,
    signal
  });

  const contentType = response.headers.get('content-type');
  if (!response.ok || isTextContent(contentType)) {
    const message = await response.text();
    throw new Error(message || 'Unable to generate enhanced speech audio.');
  }

  const audioBlob = await response.blob();
  if (!audioBlob.size) {
    throw new Error('The speech service returned an empty audio file.');
  }

  const objectUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(objectUrl);
  audio.preload = 'auto';

  return { audio, objectUrl };
};

export const disposeVoiceRssPlayback = (playback: VoiceRssPlayback | null) => {
  if (!playback) {
    return;
  }

  playback.audio.pause();
  playback.audio.src = '';
  URL.revokeObjectURL(playback.objectUrl);
};
