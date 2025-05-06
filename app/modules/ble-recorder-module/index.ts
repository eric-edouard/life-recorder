// Reexport the native module. On web, it will be resolved to BleRecorderModule.web.ts
// and on native platforms to BleRecorderModule.ts
export { default } from './src/BleRecorderModule';
export { default as BleRecorderModuleView } from './src/BleRecorderModuleView';
export * from  './src/BleRecorderModule.types';
