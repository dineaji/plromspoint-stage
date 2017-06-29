const request = require('supertest');

var app = require('../app.js').app;

describe('Basic Route', (done)=>{
//Testcast to get the homepage
  it('should return a response',(done)=>{
    request(app)
    .get('/')
    .expect(200)
    .expect((res)=>{
      expect(res.body).toInclude({
        error: 'Page not loaded'
      });
    })
    .end(done);
  });
})
