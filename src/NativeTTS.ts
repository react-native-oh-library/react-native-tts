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

// type SimpleEvents = "tts-start" | "tts-finish" | "tts-error" | "tts-cancel";
// type SimpleEvent = {
//   utteranceId: string | number;
// };

// type ProgressEventName = "tts-progress";
// type ProgressEvent = {
//   utteranceId: string | number;
//   location: number;
//   length: number;
// };

// export type TtsEvent<
//   T extends TtsEvents = TtsEvents
// > = T extends ProgressEventName ? ProgressEvent : SimpleEvent;

// export type TtsEventHandler<T extends TtsEvents = TtsEvents> = (
//     event: TtsEvent<T>
//   ) => any;

// export type TtsEvents = SimpleEvents | ProgressEventName;

type CallbackEvent = (id: string) => void;

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
    getInitStatus(): Promise<string>;
    setDefaultRate(rate: number, skipTransform?: boolean): Promise<"success">;
    setDefaultPitch(pitch: number): Promise<"success">;
    voices(): Promise<Voice[]>;
    speak(utterance: string, params?: {}): Promise<string>;
    stop(onWordBoundary?: boolean):  Promise<boolean>;
    setDucking(enabled: boolean): Promise<boolean>;
    pause(onWordBoundary?: boolean): Promise<boolean>;
    resume(): Promise<boolean>;
    addEventListener(
        type: string,
        handler: CallbackEvent
      ):void;
    removeEventListener(
      type: string,
      handler: CallbackEvent
    ):void;
} 
 
export default TurboModuleRegistry.get<Spec>('TTSNativeModule') as Spec | null;