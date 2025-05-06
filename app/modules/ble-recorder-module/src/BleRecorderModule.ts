import { NativeModule, requireNativeModule } from 'expo';

import { BleRecorderModuleEvents } from './BleRecorderModule.types';

declare class BleRecorderModule extends NativeModule<BleRecorderModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<BleRecorderModule>('BleRecorderModule');
