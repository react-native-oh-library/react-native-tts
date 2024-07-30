/**
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

type SimpleEvents = "tts-start" | "tts-finish" | "tts-error" | "tts-cancel" | "tts-pause" | "tts-resume";
type SimpleEvent = {
  utteranceId: string | number;
};

type ProgressEventName = "tts-progress";
type ProgressEvent = {
  utteranceId: string | number;
  location: number;
  length: number;
};

export type TtsEvent = ProgressEvent | SimpleEvent;

export type TtsEventHandler = (
    event: TtsEvent
  ) => unknown;

export type TtsEvents = SimpleEvents | ProgressEventName;

export type EventCallback = (event: string) => void;

export type Engine = {
  name: string;
  label: string;
  default: boolean;
  icon: number;
};

export type Voice = {
  id: string;
  name: string;
  language: string;
  quality: number;
  latency: number;
  networkConnectionRequired: boolean;
  notInstalled: boolean;
};

export interface Spec extends TurboModule {
    getInitStatus(): Promise<"success">;
    requestInstallEngine(): Promise<"success">;
    requestInstallData(): Promise<"success">;
    setDucking(enabled: boolean): Promise<"success">;
    setDefaultEngine(engineName: string): Promise<boolean>;
    setDefaultVoice(voiceId: string): Promise<"success">;
    setDefaultRate(rate: number, skipTransform?: boolean): Promise<"success">;
    setDefaultPitch(pitch: number): Promise<"success">;
    setDefaultLanguage(language: string): Promise<"success">;
    setIgnoreSilentSwitch(ignoreSilentSwitch: boolean): Promise<boolean>;
    voices(): Promise<Voice[]>;
    engines(): Promise<Engine[]>;
    speak(utterance: string, params?: {}): string | number;
    stop(onWordBoundary?: boolean):  Promise<boolean>;
    pause(onWordBoundary?: boolean): Promise<boolean>;
    resume(): Promise<boolean>;
    addEventListener(
        type: string,
        handler: TtsEventHandler
      ):void;
    removeEventListener(
      type: string,
      handler: TtsEventHandler
    ):void;
} 
 
export default TurboModuleRegistry.get<Spec>('TTSNativeModule') as Spec | null;