/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_VOICERSS_KEY?: string;
    readonly VITE_VOICERSS_LANGUAGE?: string;
    readonly VITE_VOICERSS_VOICE?: string;
    readonly VITE_VOICERSS_AUDIO_FORMAT?: string;
    readonly VITE_VOICERSS_RATE?: string;
  }
}

export {};
