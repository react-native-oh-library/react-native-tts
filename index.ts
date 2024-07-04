import { NativeModules, TurboModuleRegistry, NativeEventEmitter, EmitterSubscription, Platform } from 'react-native';
import type {Options, TtsEvents, TtsEventHandler} from './index.d'


const TextToSpeech = TurboModuleRegistry?TurboModuleRegistry.get('TTSNativeModule'): NativeModules.TextToSpeech;


class Tts extends NativeEventEmitter {

  private eventMap:Record<string, EmitterSubscription> = {};

  constructor() {
    super(TextToSpeech);
  }  

  get isIWH(): boolean {
    return ['ios', 'windows', 'harmony'].includes(Platform.OS)
  }

  get isIH(): boolean {
    return ['ios', 'harmony'].includes(Platform.OS) 
  }

  getInitStatus() {
    if (this.isIWH) {
      return Promise.resolve(true);
    }
    return TextToSpeech.getInitStatus();
  }

  // requestInstallEngine() {
  //   if (this.isIWH) {
  //     return Promise.resolve(true);
  //   }
  //   return TextToSpeech.requestInstallEngine();
  // }

  // requestInstallData() {
  //   if (this.isIWH) {
  //     return Promise.resolve(true);
  //   }
  //   return TextToSpeech.requestInstallData();
  // }

  // setDucking(enabled) {
  //   if (Platform.OS === 'windows') {
  //     return Promise.resolve(true);
  //   }
  //   return TextToSpeech.setDucking(enabled);
  // }

  // setDefaultEngine(engineName) {
  //   if (this.isIWH) {
  //     return Promise.resolve(true);
  //   }
  //   return TextToSpeech.setDefaultEngine(engineName);
  // }

  // setDefaultVoice(voiceId) {
  //   return TextToSpeech.setDefaultVoice(voiceId);
  // }

  setDefaultRate(rate: number, skipTransform?: boolean) {
    return TextToSpeech.setDefaultRate(rate, !!skipTransform);
  }

  setDefaultPitch(pitch: number) {
    return TextToSpeech.setDefaultPitch(pitch);
  }

  // setDefaultLanguage(language) {
  //   return TextToSpeech.setDefaultLanguage(language);
  // }

  // setIgnoreSilentSwitch(ignoreSilentSwitch) {
  //   if (this.isIWH) {
  //     return TextToSpeech.setIgnoreSilentSwitch(ignoreSilentSwitch);
  //   }
  //   return Promise.resolve(true);
  // }

  voices() {
    return TextToSpeech.voices();
  }

  // engines() {
  //   if (this.isIWH) {
  //     return Promise.resolve([]);
  //   }
  //   return TextToSpeech.engines();
  // }

  speak(utterance: string, options?: Options) {
    // compatibility with old-style voiceId argument passing
    if (typeof options === 'string') {
      if (this.isIH) {
        return TextToSpeech.speak(utterance, { iosVoiceId: options });
      } else {
        return TextToSpeech.speak(utterance, {});
      }
    } else {
      if (this.isIWH) {
        return TextToSpeech.speak(utterance, options);
      } else {
        return TextToSpeech.speak(utterance, options?.androidParams || {});
      }
    }
  }

  stop(onWordBoundary?: boolean) {
    if (this.isIH) {
      return TextToSpeech.stop(onWordBoundary);
    } else {
      return TextToSpeech.stop();
    }
  }

  pause(onWordBoundary?: boolean) {
    if (this.isIH) {
      return TextToSpeech.pause(onWordBoundary);
    }
    return Promise.resolve(false);
  }

  resume() {
    if (this.isIH) {
      return TextToSpeech.resume();
    }
    return Promise.resolve(false);
  }

  addEventListener<T extends TtsEvents>(type: T, handler: TtsEventHandler<T>) {
    const fn = this.addListener(type, handler);
    this.eventMap[type] = fn;
  }

  removeEventListener<T extends TtsEvents>(type: T, handler: (event: string) => void) {
    const fn = this.eventMap[type];
    if (fn) {
        fn.remove();
        delete this.eventMap[type];
        handler(type);
    }
  }
}

export default new Tts();
