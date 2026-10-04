// The era stream: the reader's default surface (D2), and the era chooser overlay the TopBar opens
// (`selectorOpen`). The moment overlay is registered by its own slice.
import { EraStream } from '@swift2/ui/reader/era/EraStream';
import { EraSelector } from '@swift2/ui/reader/shell/EraSelector';
import { register } from './instance';

register({ slice: 'era', slots: { 'surface:era': EraStream, 'overlay:era-selector': EraSelector } });
