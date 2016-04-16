'use strict';


const Assert = require('assert');
const Server = require('../');


process.env.JWT_EMAIL = 'rb-504@divine-clone-123118.iam.gserviceaccount.com';
process.env.JWT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCIiyDSr63GMucJ\nVIYMJ9xZuZL+AarfKoYDjk6jg95ogYhwQxhQX9lI9RYVfo2esY7rItmeWbE7hSA/\nwhcgVZQ2HVJoZXLHzvYyhvysgo1GfhDcr+v4kXoO3xzCGggKjONeyF9cMHcBNvZN\nBpeDv6dwKMGBBlZ+DY1DbbzUOJjeU9lB2Dw1/IuUseoSubY5DUQbZmqKISKVVsT3\n8WZ+KIj+1IPjuw6c1XveSXMk26HpNl/inRbSffT5sYuW6f+X6rkHIYvHqlcH3Nbl\n+TCf0KWjFSZWPIKIhjaX2ggcnJ1Zm1xPWHLDdd1pLGvVjMRqxhfyV0oVFEC0kz0a\nqqtFMylTAgMBAAECggEAKxCmc4zRJBfd4oV0GdVgnDP5dn+UIvrIdcqmZtAqj497\nNt0SiBcS8v3Jz1Gw3QJnbyX4uQbU7U7ZkwJmRN549nBdE2wbvYU7BUip3Mb4Q+ly\n7AfYRverJZGdAmMvchRpifVsjikC/7EUEcsocnc6GhfgoA8drHgdu8yap9yJ6mTT\nPf3JDOlbE2p/b2JvfhKR3yJmMTNd4BvamLGWSuwx1tIvtWsPaMhFYMtbOs8EvGXV\n15XWO7QsPDX3LwjszjWiiKVIbAyO60tW2ZHeuDlDZaNFkVfTsvh2x3xZO7ky8T2q\nSS0w+1Lx9VGUwXMbK0AFZxqW5BXt0nNB4q3p+A1X0QKBgQDmHeGSoN6FRebhJj+S\nXM9TQkICJNZgt5sjMkv02vd+91qCwyga6BWA8yljLjAEBKLHVph4GNLeIemoH8lz\n9Ab2dC83jwAiYCqwGnKWy+C1AcV7gUCZogVfCgc7cdJG3h8aNzcHZIwD+R9cAdRt\nZJz9xiQMoki0rwDVfmLeR5aNJQKBgQCX5te8f4/rDQ7rX9Vh8/I+aEks1AuHyVm0\n40s+TqtrVrdUL8X+PD8yqbkK9TsKtzDCg8xegHgJ4iHchG1ozJs/nEmIGTHPftJm\nitEuLOl6yYFEX/PMCILAng8IHV85JiT/pnEaalVcZPwE3aeWbm2odqjTAKTVEHtw\nR+QRYbEfFwKBgQDVE54ns6XYKh3bJRuAX0fqhFOywIFxFRIlyRDkLU0217uLkUG1\niGlA+ee82qvDTLeddOXBbtryrNw6vRRAthksY/DEtTkem4Vrg1HPqADuGjHOZqR2\nnbvzgMmplX9r94k9MRtXURcFJsyO2XLlyGBF7A69VBeWluViyqCpygfxsQKBgFZ+\nTld59zPrEpS50+HbqxMYBJqu/wXJg/f4+I4482jCTs90CHRUT9QESmZP7teSKgSI\nUaV512AhUBClozrqTngxALmrRu6Uky9qWePGFQgilyWc0VBbhEAzf/Gp79+1tZmQ\nZ5SX+ZULt2j54YRJys0DC+xh0Hm10ePEO7wd+WHvAoGAZxdT5pYK+kCEhx2HE+Kd\nxnDHtuDPsATYuEac2o7S3+0p8ygr4LXxpyqjEPCAbKw+4N46tKptnW7sEEXI/vE+\npqVK1xIC+oUXTj+5ehKOTjwZFxcgi+F6YNvalYAT2ArtXv39GLSR0XbYHptyFbil\nRbcZUQGFHof7WuUNO9lfDBM=\n-----END PRIVATE KEY-----\n';
process.env.ADMINS = 'lupomontero@gmail.com';
process.env.NAME = 'romanbauer.org';


describe('server', () => {

  let server;

  before(function (done) {

    this.timeout(10 * 1000);

    Server({}, (err, s) => {

      Assert.ok(!err);

      server = s;
      done();
    });
  });

  it('GET / should serve index.html', function (done) {

    server.inject('/', (resp) => {

      Assert.equal(resp.statusCode, 200);
      //console.log(resp.payload);
      //console.log(resp.headers);
      Assert.ok(/^text\/html/.test(resp.headers['content-type']));
      done();
    });
  });

  it('GET /_images should serve images json array', (done) => {

    server.inject('/_images', (resp) => {

      Assert.equal(resp.statusCode, 200);
      Assert.ok(/^application\/json/.test(resp.headers['content-type']));
      //console.log(resp.headers);
      const body = JSON.parse(resp.payload);
      Assert.equal(typeof body.length, 'number');
      //console.log(body);
      done();
    });
  });

});
