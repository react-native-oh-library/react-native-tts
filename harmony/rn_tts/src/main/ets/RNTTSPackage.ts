/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */
import type { TurboModule, TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { RNPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { RNTTSTurboModule } from './RNTTSTurboModule';

class RNTTSTurboModuleFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (this.hasTurboModule(name)) {
      return new RNTTSTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.TTSNativeModule.NAME;
  }
}

export class RNTTSPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new RNTTSTurboModuleFactory(ctx);
  }
}