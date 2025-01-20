import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './data/database.sqlite',
});

export const ShortUrl = sequelize.define('ShortUrl', {
	originalUrl: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	shortUrl: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	expiresAt: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	clickCount: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	}
}, {
	updatedAt: false,
	createdAt: true,
});

export const ClickAnalytics = sequelize.define('ClickAnalytics', {
	shortUrlId: {
		type: DataTypes.INTEGER,
		references: {
			model: ShortUrl,
			key: 'id',
		},
	},
	ipAddress: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	accessedAt: {
		type: DataTypes.DATE,
		defaultValue: Sequelize.NOW,
	},
}, {
	updatedAt: false,
	createdAt: false,
});

ShortUrl.hasMany(ClickAnalytics, { foreignKey: 'shortUrlId', as: 'clicks' });
ClickAnalytics.belongsTo(ShortUrl, { foreignKey: 'shortUrlId' });


await sequelize.sync({ force: true });
