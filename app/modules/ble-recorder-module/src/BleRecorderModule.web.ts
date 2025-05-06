import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './BleRecorderModule.types';

type BleRecorderModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class BleRecorderModule extends NativeModule<BleRecorderModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(BleRecorderModule, 'BleRecorderModule');
