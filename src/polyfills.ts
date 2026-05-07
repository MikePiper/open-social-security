import '@angular/localize/init';
import 'zone.js';

if (typeof window !== 'undefined') {
  (window as any).process = {
    env: { NODE_ENV: 'production' },
  };

  (window as any).Buffer = (window as any).Buffer || {
    from: (input: any) => new Uint8Array(input),
  };
}
