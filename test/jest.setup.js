import { Sequelize } from 'sequelize';
import {ShortUrl, ClickAnalytics} from "../db/model.js"
import request from 'supertest';
import { app } from '../app.js';
