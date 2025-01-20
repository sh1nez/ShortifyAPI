import { Sequelize } from 'sequelize';
import { ShortUrl, ClickAnalytics } from '../models.js';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
});

ShortUrl.init(sequelize);
ClickAnalytics.init(sequelize);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await ShortUrl.destroy({ where: {} });
  await ClickAnalytics.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});
