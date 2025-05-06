import { requireNativeView } from 'expo';
import * as React from 'react';

import { BleRecorderModuleViewProps } from './BleRecorderModule.types';

const NativeView: React.ComponentType<BleRecorderModuleViewProps> =
  requireNativeView('BleRecorderModule');

export default function BleRecorderModuleView(props: BleRecorderModuleViewProps) {
  return <NativeView {...props} />;
}
