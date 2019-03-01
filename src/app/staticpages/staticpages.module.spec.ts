import { StaticPagesModule } from './staticpages.module';

describe('StaticPagesModule', () => {
  let articlesModule: StaticPagesModule;

  beforeEach(() => {
    articlesModule = new StaticPagesModule();
  });

  it('should create an instance', () => {
    expect(articlesModule).toBeTruthy();
  });
});
