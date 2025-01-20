import request from 'supertest';
import { app } from '../app.js';
import { ShortUrl } from '../db/model.js';

describe('URL Shortener API', () => {
  beforeEach(async () => {
    await ShortUrl.destroy({ where: {} });
  });

  describe('POST /shorten', () => {
    it('should create a short URL with a custom alias', async () => {
      const response = await request(app)
        .post('/shorten')
        .send({ originalUrl: 'https://example.com', alias: 'my-alias' });

      expect(response.status).toBe(201);
      expect(response.body.url).toBe('my-alias');
    });

    it('should return 400 if alias is already in use', async () => {
      await request(app)
        .post('/shorten')
        .send({ originalUrl: 'https://example.com', alias: 'my-alias' });

      const response = await request(app)
        .post('/shorten')
        .send({ originalUrl: 'https://another-example.com', alias: 'my-alias' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Alias already in use');
    });
  });

  describe('GET /:shortUrl', () => {
    it('should redirect to the original URL', async () => {
      const createResponse = await request(app)
        .post('/shorten')
        .send({ originalUrl: 'https://example.com' });

      const shortUrl = createResponse.body.url;

      const redirectResponse = await request(app)
        .get(`/${shortUrl}`)
        .redirects(0); // Disable automatic redirection

      expect(redirectResponse.status).toBe(302);
      expect(redirectResponse.headers.location).toBe('https://example.com'); 
    });

    it('should return 404 if short URL is not found', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404); // not found
      expect(response.text).toBe('Short URL not found.');
    });
  });
});
