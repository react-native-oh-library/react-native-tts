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

import { textToSpeech } from '@kit.CoreSpeechKit';
import { util } from '@kit.ArkTS';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import {AudioPlayer} from './AudioPlayer';

type EventCallback = (id: string) => void;


export class TextToSpeechManager  {
  private tts: textToSpeech.TextToSpeechEngine;
  private ready: boolean;
  private eventListeners: { [key: string]: EventCallback[] } = {};

  private audioPlayer: AudioPlayer;

  private speakParams:Record<string, Object> = {
    // 语速，0.5-2
    "speed": 1,
    // 音调，0-2
    "pitch": 1,
    // 合成类型，为0返回音频流，为1播放
    "playType": 0,
    // "soundChannel": 1
  }

  constructor() {
    this.initEngine();
    this.audioPlayer = new AudioPlayer();
  }

  /*创建tts实例*/
  private initEngine(): Promise<string> {
    const extraParam: Record<string, Object> = {
      "style": 'interaction-broadcast',
      "locate": 'CN',
      "name": 'EngineName'
    };
    const initParamsInfo: textToSpeech.CreateEngineParams = {
      // 当前仅支持“zh-CN”中文
      language: 'zh-CN',
      // 音色，不可修改
      person: 0,
      // 0为在线，1为离线，当前仅支持离线模式
      online: 1,
      extraParams: extraParam
    };
    return new Promise((resolve, reject) => {
      textToSpeech.createEngine(initParamsInfo).then(res => {
        this.tts = res;
        this.tts.setListener(this.speakCallback);
        this.ready = true;
        resolve('Success');
      }).catch(error => {
        reject(JSON.stringify(error));
      });
    })
  }

  /*设置speak的回调信息*/
  private get speakCallback(){
    const that = this;
    return {
      // 开始播报回调
      onStart(requestId: string, response: textToSpeech.StartResponse) {
      },
      // 合成完成及播报完成回调
      onComplete(requestId: string, response: textToSpeech.CompleteResponse){
        that.dispatchEvent('tts-start', requestId);
        that.audioPlayer.sortBufferQueue();
        that.audioPlayer.processQueue(requestId, () => {
          that.audioPlayer.stop();
        });
      },
      // 停止播报回调
      onStop(requestId: string, response: textToSpeech.StopResponse) {
      },
      // 返回音频流
      onData(requestId: string, audio: ArrayBuffer, response: textToSpeech.SynthesisResponse) {
        if(response.sequence > 0){
          that.audioPlayer.receiveData({buffer: audio, index: response.sequence}, requestId);
        }
      },
      // 错误回调
      onError(requestId: string, errorCode: number, errorMessage: string) {
        that.dispatchEvent('tts-error', requestId);
      }
    }
  }

  /*获取当前初始化状态，若没有完成初始化则重新初始化*/
  public getInitStatus(): Promise<string> {
    return new Promise((resolve, reject) => {
      if(!this.ready){
        try {
          this.initEngine().then(() => {
            resolve('Success');
          }).catch(err => {
            reject(err);
          })
        } catch (exception) {
          reject(JSON.stringify(exception));
        }
      }else{
        resolve('Success');
      }
    })
  }

  /*获取当前音色列表*/
  public voices(): Promise<TM.TTSNativeModule.Voice[]> {
    let voicesQuery: textToSpeech.VoiceQuery = {
      requestId: util.generateRandomUUID(false),
      // 当前只支持离线模式
      online: 1
    };
    return new Promise((resolve, reject) => {
      try {
        this.tts.listVoices(voicesQuery).then(res => {
          const rList = res.map(v => {
            return {
              id: '',
              name: '',
              language: v.language,
              quality: 0,
              latency: 0,
              networkConnectionRequired: false,
              notInstalled: false
            }
          });
          resolve(rList);
        })
      } catch (e) {
        reject(e);
      }
    })
  }

  /*设置默认语速*/
  public setDefaultRate(rate: number, skipTransform?: boolean): Promise<"success"> {
    return new Promise((resolve, reject) => {
      try {
        this.speakParams.speed = rate;
        resolve('success');
      } catch (e) {
        reject(e);
      }
    });
  }

  /*设置默认音调*/
  public setDefaultPitch(pitch: number): Promise<"success"> {
    return new Promise((resolve, reject) => {
      try {
        this.speakParams.pitch = pitch;
        resolve('success');
      } catch (e) {
        reject(e);
      }
    });
  }

  /*停止语音播放*/
  public stop(onWordBoundary?: boolean): Promise<boolean> {
    return this.audioPlayer.stop();
  }

  /*开始合成语音并播放*/
  public speak(utterance: string, params: Record<string, string> = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        reject(new Error('TTS not ready'));
        return;
      }

      if(this.tts.isBusy()){
        return;
      }

      const utteranceId = util.generateRandomUUID(false);
      const speakParams = {requestId: utteranceId, extraParams: {...this.speakParams, ...params}};
      try {
          this.audioPlayer.start().then(() => {
            this.audioPlayer.clearCacheData().then(() => {
              this.tts.speak(utterance, speakParams);
              resolve('Success');
            })
          })
      } catch (exception) {
        reject(JSON.stringify(exception));
      }
    });
  }

  /*暂停语音播放*/
  public pause(onWordBoundary: boolean): Promise<boolean> {
    return this.audioPlayer.pause();
  }

  /*重新播放之前暂停的语音*/
  public resume(): Promise<boolean> {
    return this.audioPlayer.resume();
  }

  /*获取音频焦点*/
  public setDucking(enabled: boolean){
    return this.audioPlayer.setDucking(enabled);
  }

  public addEventListener(type: string, listener: EventCallback) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  }

  public removeEventListener(type: string, listener: EventCallback) {
    const listeners = this.eventListeners[type];
    if (listeners) {
      this.eventListeners[type] = listeners.filter(l => l !== listener);
    }
  }

  private dispatchEvent(type: string, id: string) {
    const listeners = this.eventListeners[type];
    if (listeners) {
      listeners.forEach(listener => {
        listener(id);
      });
    }
  }
}