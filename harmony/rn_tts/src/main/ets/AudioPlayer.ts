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

import audio from '@ohos.multimedia.audio';
import { RNOHContext } from '@rnoh/react-native-openharmony/ts';


type DataItem = {buffer: ArrayBuffer, index: number};
type Callback = () => void;


export class AudioPlayer {
  private TAG: string = 'AudioPlayer';
  private context: RNOHContext | undefined = undefined;
  private audioRenderer: audio.AudioRenderer;
  private bufferQueue: DataItem[] = [];
  private isWriting: boolean = false;
  public writeId: string = '';

  constructor(ctx: RNOHContext) {
    this.context = ctx;
    this.getAudioRenderer();
  }

  private get audioStatus(): number {
    return this.audioRenderer.state.valueOf();
  }

  public get isPrepare(): boolean {
    return this.audioStatus === audio.AudioState.STATE_PREPARED;
  }

  public get isRunning(): boolean {
    return this.audioStatus === audio.AudioState.STATE_RUNNING;
  }

  public get isPause(): boolean {
    return this.audioStatus === audio.AudioState.STATE_PAUSED;
  }

  public get isStop(): boolean {
    return this.audioStatus === audio.AudioState.STATE_STOPPED;
  }

  /*获取音频渲染器*/
  private getAudioRenderer(): Promise<string> {
    const audioStreamInfo: audio.AudioStreamInfo = {
      samplingRate: audio.AudioSamplingRate.SAMPLE_RATE_16000,
      channels: audio.AudioChannel.CHANNEL_1,
      sampleFormat: audio.AudioSampleFormat.SAMPLE_FORMAT_S16LE,
      encodingType: audio.AudioEncodingType.ENCODING_TYPE_RAW
    };

    const audioRendererInfo: audio.AudioRendererInfo = {
      usage: audio.StreamUsage.STREAM_USAGE_MUSIC,
      rendererFlags: 0
    };

    const audioRendererOptions: audio.AudioRendererOptions = {
      streamInfo: audioStreamInfo,
      rendererInfo: audioRendererInfo
    };

    return new Promise((resolve, reject) => {
      audio.createAudioRenderer(audioRendererOptions,(err, data) => {
        if (err) {
          reject(JSON.stringify(err));
          throw new Error(JSON.stringify(err));
        } else {
          this.audioRenderer = data;
          resolve('Success');
        }
      });
    })
  }

  // 清空缓存数据
  public clearCacheData(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.bufferQueue = [];
        this.writeId = '';
        this.isWriting = false;
        resolve();
      } catch (e) {
        reject();
        throw new Error(JSON.stringify(e));
      }
    })
  }

  // 接收音频数据流
  public receiveData(data: DataItem, requestId: string) {
    this.writeId = requestId;
    this.bufferQueue.push(data);
  }

  // 接收到的音频流顺序有误，不预先排序会产生杂音
  public sortBufferQueue(){
    this.bufferQueue.sort((a: DataItem, b: DataItem) => a.index -b.index);
  }

  // 处理缓冲队列
  public async processQueue(requestId: string, callback?: Callback) {
    // 写入过程中，不处理新的数据
    if(this.isWriting){
      return;
    }
    this.isWriting = true;

    while (this.bufferQueue.length > 0) {
      // 暂停时，禁止写入
      if(!this.isRunning){
        break;
      };
      const data = this.bufferQueue.shift();
      if (data) {
        await this.writeAudio(data, requestId);
      }
    }

    this.isWriting = false;
    if(!this.bufferQueue.length){
      this.stop();
      callback && callback();
      return;
    }
  }

  // 写入音频数据
  public async writeAudio(data: DataItem, curWriteId: string) {
    this.writeId = curWriteId;
    try {
      const byteLength = data.buffer.byteLength;
      const bufferSize = this.audioRenderer.getBufferSizeSync();
      let offset = 0;

      while (offset < byteLength) {
        // 如果音频状态不是运行中，暂停写入
        if (!this.isRunning) {
          break;
        }
        // 切片写入缓存区数据
        const currentBufferSize = Math.min(bufferSize, byteLength - offset);
        const buffer = data.buffer.slice(offset, offset + currentBufferSize);

        await this.audioRenderer.write(buffer);
        offset += currentBufferSize;
      }


    } catch (e) {
      throw new Error(JSON.stringify(e));
    }
  }

  public start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.audioRenderer.flush();
        this.audioRenderer.start().then(() => {
          resolve(true);
        }).catch((e) => reject(JSON.stringify(e)));
      } catch (e) {
        reject(JSON.stringify(e));
        throw new Error(JSON.stringify(e));
      }
    })
  }

  public stop(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if(this.isRunning){
          this.audioRenderer.stop().then(() => {
            this.emitEvent('tts-cancel');
            this.audioRenderer.flush();
            resolve(true);
          }).catch((e) => reject(JSON.stringify(e)));
        }
      } catch (e) {
        reject(JSON.stringify(e));
        throw new Error(JSON.stringify(e));
      }
    })
  }

  /*暂停*/
  public pause(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if(this.isRunning && !this.isPause){
          this.emitEvent('tts-pause');
          this.audioRenderer.pause();
          this.isWriting = false;
          resolve(true);
        }
      } catch (e) {
        reject(JSON.stringify(e));
        throw new Error(JSON.stringify(e));
      }
    })
  }

  /*继续播放*/
  public resume(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if(this.isPause && !this.isRunning){
          this.audioRenderer.start().then(() => {
            this.emitEvent('tts-resume');
            this.processQueue(this.writeId);
            resolve(true);
          }).catch((e) => reject(JSON.stringify(e)));
        }
      } catch (e) {
        reject(JSON.stringify(e));
        throw new Error(JSON.stringify(e));
      }
    })
  }

  /*清空缓存区*/
  public flush(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.audioRenderer.flush();
        resolve(true);
      } catch (e) {
        reject(JSON.stringify(e));
        throw new Error(JSON.stringify(e));
      }
    })
  }

  private emitEvent(name: string){
    this.context.rnInstance.emitDeviceEvent(name, this.writeId);
  }
}
