import express from 'express';
import bodyParser from 'body-parser';
import cors from "cors"
import crypto from 'crypto';
import { analytics, click, create_url, find_url } from './db/util.js';
import { ShortUrl } from './db/model.js';

export const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors())

const generateHash = () => crypto.randomBytes(3).toString('hex');

app.post('/shorten', async (req, res) => {
	const { originalUrl, expiresAt, alias } = req.body;

	if (!originalUrl) {
		return res.status(400).json({ error: 'OriginalUrl required' });
	}

	if (alias && alias.length > 20) {
		return res.status(400).json({ error: 'Alias must be 20 characters or less' });
	}

	const isValidUrl = /^https?:\/\//i.test(originalUrl);
	if (!isValidUrl) {
		return res.status(400).json({ error: 'URL must start with http:// or https://' });
	}

	try {
		let shortUrl;
		if (alias) {
			const existingUrl = await find_url(alias);
			if (existingUrl) {
				return res.status(400).json({ error: 'Alias already in use' });
			}
			shortUrl = alias;
		}
		else {
			let isUnique = false;
			let cnt = 0; // Counter to prevent infinite loops
			while (!isUnique && cnt < 1e6) {
				shortUrl = generateHash();
				const existingUrl = await find_url(shortUrl)
				if (!existingUrl) {
					isUnique = true;
				}
				cnt += 1;
			}

			// better to use at list 16 symbols.
			if (!isUnique)
				return res.status(503).send("Try later")
		}

		await create_url(originalUrl, shortUrl, expiresAt || null)
		console.log(shortUrl)
		return res.status(201).json({ url: shortUrl })
	} catch (error) {
		console.error(error.message);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

app.get('/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;

	if (!shortUrl) {
		return res.status(400).json({ error: 'ShortUrl required' });
	}
	try {
		const urlRecord = await find_url(shortUrl);
		if (!urlRecord) {
			return res.status(404).send('Short URL not found.');
		}
		if (urlRecord.expiresAt && new Date() > urlRecord.expiresAt) {
			return res.status(410).send('The link has expired');
		}
		await urlRecord.increment('clickCount');
		await click(urlRecord.id, req.ip) // ipv6
		return res.redirect(urlRecord.originalUrl);
	} catch (error) {
		console.error('Redirect error:', error.message);
		return res.status(500).send('Internal server error');
	}
});

app.get('/info/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;
	if (!shortUrl) {
		return res.status(400).json({ error: 'ShortUrl required' });
	}
	try {
		const urlRecord = await find_url(shortUrl);

		if (!urlRecord) {
			return res.status(404).json({ error: 'Короткий URL не найден.' });
		}

		if (urlRecord.expiresAt && new Date() > urlRecord.expiresAt) {
			return res.status(410).json({ error: 'The link has expired.' });
		}

		res.status(200).json({
			originalUrl: urlRecord.originalUrl,
			createdAt: urlRecord.createdAt,
			clickCount: urlRecord.clickCount,
		});
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// TODO check that it's owner's request
app.delete('/delete/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;

	if (!shortUrl) {
		return res.status(400).json({ error: 'ShortUrl required' });
	}

	try {
		const urlRecord = await ShortUrl.findOne({ where: { shortUrl } });

		if (!urlRecord) {
			return res.status(404).json({ error: "ShortUrl Doesn't exist." });
		}
		await urlRecord.destroy();

		res.status(200).json({ message: 'Ok' });
	} catch (error) {
		console.error(error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// TODO check that it's owner's request
app.get('/analytics/:shortUrl', async (req, res) => {
	const { shortUrl } = req.params;

	if (!shortUrl) {
		return res.status(400).json({ error: 'ShortUrl is required' });
	}

	try {
		const urlRecord = await find_url(shortUrl)

		if (!urlRecord) {
			return res.status(404).json({ error: 'Short URL not found.' });
		}

		const clickCount = urlRecord.clickCount;
		const { ipAddresses } = await analytics(urlRecord.id)
		res.status(200).json({
			clickCount,
			ipAddresses,
		});
	} catch (error) {
		console.error('Analytics error:', error.message);
		res.status(500).json({ error: 'Internal server error' });
	}
});


app.listen(port, () => {
	console.log(`URL Shortener API running on http://localhost:${port}`);
});
