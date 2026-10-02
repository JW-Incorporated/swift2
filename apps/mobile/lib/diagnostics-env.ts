// Device facts for the diagnostics report. expo-device / expo-application /
// expo-updates / expo-constants are all already dependencies (no native
// change). Only coarse, non-identifying values: hardware model, OS version,
// app build, update id — never deviceName, push tokens or install ids.
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import type { DiagEnv } from './diagnostics';

export function readDiagEnv(): DiagEnv {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '?';
  const buildNumber = Application.nativeBuildVersion ?? '?';
  return {
    model: Device.modelName ?? Device.modelId ?? 'unknown',
    os: `${Platform.OS} ${Device.osVersion ?? String(Platform.Version)}`,
    build: `${version} (${buildNumber})`,
    updateId: Updates.updateId ?? 'embedded',
  };
}

/** Version label for Settings, e.g. `Version 1.0.0 (42)`. */
export function versionLabel(): string {
  return `Version ${readDiagEnv().build}`;
}
