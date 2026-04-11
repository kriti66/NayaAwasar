const request = require('supertest');
const app = require('./app');

describe('Basic Test', () => {
  test('should return 200 for home route', async () => {
    const res = await request(app).get('/');
    
    expect(res.statusCode).toBe(200);
  });
});