import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createVoiceRssPlayback,
  disposeVoiceRssPlayback,
  type VoiceRssConfig,
  type VoiceRssPlayback
} from '../../utils/speech/voiceRss';

const WORD_LENGTHS = [2, 3, 4, 5, 6] as const;
type WordLength = (typeof WORD_LENGTHS)[number];

const WORDS_BY_LENGTH: Record<WordLength, string[]> = {
  2: ['am', 'at', 'go', 'in', 'it', 'me', 'no', 'so', 'up', 'we'],
  3: ['cat', 'dog', 'sun', 'hat', 'map', 'bug', 'jam', 'red', 'bus', 'log'],
  4: ['play', 'jump', 'read', 'ship', 'math', 'star', 'blue', 'ring', 'wave', 'frog'],
  5: ['apple', 'smile', 'train', 'chair', 'light', 'bread', 'cloud', 'grape', 'plant', 'share'],
  6: ['planet', 'rocket', 'friend', 'puzzle', 'garden', 'school', 'silver', 'sunset', 'butter', 'castle']
};

const CHILD_VOICE_KEYWORDS = ['child', 'kid', 'boy', 'girl', 'junior', 'young', 'teen'];

const DEFAULT_LENGTH: WordLength = 3;

const pickRandomWord = (length: WordLength, previous?: string): string => {
  const options = WORDS_BY_LENGTH[length];
  if (!options.length) {
    return '';
  }

  if (options.length === 1) {
    return options[0];
  }

  let next = previous ?? '';
  while (next === previous) {
    const index = Math.floor(Math.random() * options.length);
    next = options[index];
  }
  return next;
};

type VoiceEngine = 'voiceRss' | 'webSpeech' | 'none';

const WordSoundGame = () => {
  const [wordLength, setWordLength] = useState<WordLength>(DEFAULT_LENGTH);
  const [word, setWord] = useState<string>(() => pickRandomWord(DEFAULT_LENGTH));
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('none');
  const [webSpeechSupported, setWebSpeechSupported] = useState(false);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speakingLetterIndex, setSpeakingLetterIndex] = useState<number | null>(null);
  const [speakingWord, setSpeakingWord] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Choose a word length, then tap a letter to hear it.');
  const voicePlaybackRef = useRef<VoiceRssPlayback | null>(null);
  const playbackAbortControllerRef = useRef<AbortController | null>(null);

  const voiceRssConfig = useMemo<VoiceRssConfig | null>(() => {
    const apiKey = import.meta.env.VITE_VOICERSS_KEY?.trim();
    if (!apiKey) {
      return null;
    }

    const language = import.meta.env.VITE_VOICERSS_LANGUAGE?.trim();
    const voice = import.meta.env.VITE_VOICERSS_VOICE?.trim();
    const audioFormat = import.meta.env.VITE_VOICERSS_AUDIO_FORMAT?.trim();
    const rateValue = import.meta.env.VITE_VOICERSS_RATE?.trim();
    const rate = rateValue ? Number(rateValue) : undefined;

    return {
      apiKey,
      language: language || 'en-us',
      voice: voice || undefined,
      audioFormat: audioFormat || undefined,
      rate: Number.isFinite(rate) ? rate : undefined
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const supportsWebSpeech =
      typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    setWebSpeechSupported(supportsWebSpeech);

    if (voiceRssConfig) {
      setVoiceEngine('voiceRss');
      setStatusMessage('Choose a word length, then tap a letter to hear it with the enhanced voice.');
    } else if (supportsWebSpeech) {
      setVoiceEngine('webSpeech');
      setStatusMessage('Choose a word length, then tap a letter to hear it.');
    } else {
      setVoiceEngine('none');
      setStatusMessage(
        'Choose a word length and sound out each letter together—audio playback is unavailable here.'
      );
    }

    if (!supportsWebSpeech) {
      return () => {
        playbackAbortControllerRef.current?.abort();
        disposeVoiceRssPlayback(voicePlaybackRef.current);
        voicePlaybackRef.current = null;
      };
    }

    const synth = window.speechSynthesis;

    const selectChildFriendlyVoice = () => {
      const voices = synth.getVoices();
      if (!voices.length) {
        return;
      }

      const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'));
      const matchByName = englishVoices.find((voice) =>
        CHILD_VOICE_KEYWORDS.some((keyword) => voice.name.toLowerCase().includes(keyword))
      );
      const fallback = englishVoices.find((voice) => voice.name.toLowerCase().includes('female')) ?? englishVoices[0];
      setPreferredVoice(matchByName ?? fallback ?? voices[0] ?? null);
    };

    selectChildFriendlyVoice();
    synth.addEventListener('voiceschanged', selectChildFriendlyVoice);

    return () => {
      synth.removeEventListener('voiceschanged', selectChildFriendlyVoice);
      synth.cancel();
      playbackAbortControllerRef.current?.abort();
      disposeVoiceRssPlayback(voicePlaybackRef.current);
      voicePlaybackRef.current = null;
    };
  }, [voiceRssConfig]);

  useEffect(() => {
    return () => {
      playbackAbortControllerRef.current?.abort();
      disposeVoiceRssPlayback(voicePlaybackRef.current);
      voicePlaybackRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const letters = useMemo(() => word.split(''), [word]);

  const speakWithWebSpeech = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!webSpeechSupported || typeof SpeechSynthesisUtterance === 'undefined') {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = preferredVoice ?? null;
      utterance.rate = 0.9;
      utterance.pitch = preferredVoice ? 1.2 : 1.15;
      utterance.onend = () => {
        onEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    },
    [preferredVoice, webSpeechSupported]
  );

  const speakWithVoiceRss = useCallback(
    async (text: string, onEnd?: () => void) => {
      if (!voiceRssConfig) {
        speakWithWebSpeech(text, onEnd);
        return;
      }

      try {
        playbackAbortControllerRef.current?.abort();
        playbackAbortControllerRef.current = new AbortController();
        disposeVoiceRssPlayback(voicePlaybackRef.current);
        voicePlaybackRef.current = null;

        const playback = await createVoiceRssPlayback(text, voiceRssConfig, playbackAbortControllerRef.current.signal);
        voicePlaybackRef.current = playback;

        playback.audio.onended = () => {
          onEnd?.();
          disposeVoiceRssPlayback(voicePlaybackRef.current);
          voicePlaybackRef.current = null;
        };
        playback.audio.onerror = () => {
          disposeVoiceRssPlayback(voicePlaybackRef.current);
          voicePlaybackRef.current = null;
          onEnd?.();
        };

        await playback.audio.play();
      } catch (error) {
        console.error('Enhanced voice playback failed', error);
        disposeVoiceRssPlayback(voicePlaybackRef.current);
        voicePlaybackRef.current = null;
        playbackAbortControllerRef.current = null;

        if (webSpeechSupported) {
          setVoiceEngine('webSpeech');
          setStatusMessage('Enhanced voice is unavailable right now. Switching to your browser voice.');
          speakWithWebSpeech(text, onEnd);
        } else {
          setVoiceEngine('none');
          setStatusMessage('Enhanced voice is unavailable right now. Sound each letter out loud together.');
          onEnd?.();
        }
      }
    },
    [speakWithWebSpeech, voiceRssConfig, webSpeechSupported]
  );

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text.trim()) {
        onEnd?.();
        return;
      }

      if (voiceEngine === 'voiceRss') {
        void speakWithVoiceRss(text, onEnd);
        return;
      }

      if (voiceEngine === 'webSpeech') {
        speakWithWebSpeech(text, onEnd);
        return;
      }

      if (webSpeechSupported) {
        setVoiceEngine('webSpeech');
        speakWithWebSpeech(text, onEnd);
        return;
      }

      onEnd?.();
    },
    [speakWithVoiceRss, speakWithWebSpeech, voiceEngine, webSpeechSupported]
  );

  const handleLengthSelect = useCallback(
    (length: WordLength) => {
      setWordLength(length);
      const nextWord = pickRandomWord(length, word);
      setWord(nextWord);
      setSpeakingLetterIndex(null);
      setSpeakingWord(false);
      const practiseHint =
        voiceEngine === 'none'
          ? 'Sound each letter out loud together.'
          : voiceEngine === 'voiceRss'
            ? 'Tap a letter to hear it with the enhanced voice.'
            : 'Tap a letter to hear it.';
      setStatusMessage(`Ready for a new ${length}-letter word. ${practiseHint}`);
    },
    [voiceEngine, word]
  );

  const handleNextWord = useCallback(() => {
    const nextWord = pickRandomWord(wordLength, word);
    setWord(nextWord);
    setSpeakingLetterIndex(null);
    setSpeakingWord(false);
    const practiseHint =
      voiceEngine === 'none'
        ? 'Sound each letter out loud together.'
        : voiceEngine === 'voiceRss'
          ? 'Tap each letter to hear the enhanced voice.'
          : 'Tap each letter to hear it.';
    setStatusMessage(`Try sounding out the new word. ${practiseHint}`);
  }, [voiceEngine, wordLength, word]);

  const handleSpeakLetter = useCallback(
    (index: number) => {
      const letter = letters[index];
      if (!letter) {
        return;
      }
      setSpeakingWord(false);
      setSpeakingLetterIndex(index);
      setStatusMessage(
        voiceEngine !== 'none'
          ? `You tapped the letter ${letter.toUpperCase()}.`
          : `Speech isn't available, but you tapped ${letter.toUpperCase()}. Say it together!`
      );
      if (voiceEngine === 'none') {
        setSpeakingLetterIndex(index);
        window.setTimeout(() => {
          setSpeakingLetterIndex((current) => (current === index ? null : current));
        }, 650);
        return;
      }
      speakText(letter, () => {
        setSpeakingLetterIndex((current) => (current === index ? null : current));
      });
    },
    [letters, speakText, voiceEngine]
  );

  const handleSpeakWord = useCallback(() => {
    if (!word || voiceEngine === 'none') {
      if (voiceEngine === 'none') {
        setStatusMessage('Speech playback is unavailable in this browser.');
      }
      return;
    }
    setSpeakingLetterIndex(null);
    setSpeakingWord(true);
    setStatusMessage(`Speaking the word ${word.toUpperCase()}.`);
    speakText(word, () => {
      setSpeakingWord(false);
      setStatusMessage(`All done! Tap a letter or choose another word to keep practising.`);
    });
  }, [speakText, voiceEngine, word]);

  return (
    <div className="learning-card learning-word-game">
      <header className="learning-card-header">
        <h4>Word sound builder</h4>
        <p>Pick a word length, hear every letter, then listen to the complete word.</p>
      </header>
      <div className="learning-card-body">
        <div className="learning-word-controls" role="group" aria-label="Select a word length">
          {WORD_LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              className={classNames('ghost', 'learning-word-length', {
                active: wordLength === length
              })}
              onClick={() => handleLengthSelect(length)}
              aria-pressed={wordLength === length}
            >
              {length}-letter
            </button>
          ))}
        </div>
        <div className="learning-word-actions">
          <button
            type="button"
            className="primary learning-word-speak"
            onClick={handleSpeakWord}
            disabled={voiceEngine === 'none'}
          >
            Speak the word
          </button>
          <button type="button" className="ghost" onClick={handleNextWord}>
            New word
          </button>
        </div>
        <div className="learning-word-letters" role="group" aria-label="Tap letters to hear their sounds">
          {letters.map((letter, index) => (
            <button
              key={`${letter}-${index}`}
              type="button"
              className={classNames('learning-letter-button', {
                speaking: speakingLetterIndex === index,
                word: speakingWord
              })}
              onClick={() => handleSpeakLetter(index)}
              aria-pressed={speakingLetterIndex === index}
              aria-label={`Hear the letter ${letter.toUpperCase()}`}
            >
              {letter.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="learning-word-message" aria-live="polite">
          {statusMessage}
        </p>
        {voiceEngine === 'none' && (
          <p className="learning-word-support">
            Speech playback is unavailable in this browser, but you can still practise reading the words together.
          </p>
        )}
      </div>
    </div>
  );
};

export default WordSoundGame;
