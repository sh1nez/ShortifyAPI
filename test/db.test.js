import { url_exists } from '../db/util.js';
import { ShortUrl, ClickAnalytics } from '../models.js';

afterEach(async () => {
	await sequelize.sync({ force: true })
});

describe('ShortUrl Model', () => {
	it("", async () => {
	})
});

describe('ClickAnalytics Model', () => {
});
