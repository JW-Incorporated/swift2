// Entry point. Gesture Handler must be imported first (Android requirement);
// the URL polyfill must load before @supabase/supabase-js so its URL parsing
// works on React Native (Hermes has no global URL). Then hand off to the app
// root.
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
