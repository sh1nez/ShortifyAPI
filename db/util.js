import { ShortUrl, ClickAnalytics } from "./model.js"

export async function create_url(originalUrl, shortUrl, expiresAt) {
	return ShortUrl.create({
		originalUrl,
		shortUrl,
		expiresAt,
		clickCount: 0,
	});

}

export async function find_url(url) {
	return (await ShortUrl.findOne({ where: { ShortUrl: url } }));
}

export async function click(shortUrlId, ipAddress) {
	return !!(await ClickAnalytics.create({
		shortUrlId,
		ipAddress,
	}));
}

export async function analytics(shortUrlId) {
	const res = await ClickAnalytics.findAll({
		where: { shortUrlId },
		order: [['accessedAt', 'DESC']],
		limit: 5,
		attributes: ['ipAddress', 'accessedAt'],
	})
	const ipAddresses = res.map(click => click.ipAddress);
	const accessedTimes = res.map(click => click.accessedAt);

	return {ipAddresses, accessedTimes}
}
