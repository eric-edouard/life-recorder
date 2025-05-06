import * as React from 'react';

import { BleRecorderModuleViewProps } from './BleRecorderModule.types';

export default function BleRecorderModuleView(props: BleRecorderModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
