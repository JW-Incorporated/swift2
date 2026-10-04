// The era stream: the reader's default surface (D2). The moment overlay is registered by its own slice.
import { EraStream } from '@swift2/ui/reader/era/EraStream';
import { register } from './instance';

register({ slice: 'era', slots: { 'surface:era': EraStream } });
