import { ScullyConfig } from '@scullyio/scully';
export const config: ScullyConfig = {
  projectRoot: "./src",
  projectName: "open-social-security",
  outDir: './dist/static',
  routes: {
    '/': {
      type: 'default'
    },
    // Add any additional routes your app uses
    '/about': { type: 'default' },
    '/legal': { type: 'default' }
  }
};
