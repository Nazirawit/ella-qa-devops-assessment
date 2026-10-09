import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 }, // Ramp-up to 20 virtual users
    { duration: '30s', target: 20 }, // Stay at 20 virtual users
    { duration: '15s', target: 0 },  // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests must complete below 250ms
    http_req_failed: ['rate<0.01'],   // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function () {
  // Test 1: GET /users
  const getRes = http.get(`${BASE_URL}/users`);
  check(getRes, {
    'GET /users status is 200': (r) => r.status === 200,
    'GET /users response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.5);

  // Test 2: POST /users
  const randomEmail = `loadtest_${__VU}_${__ITER}_${Date.now()}@example.com`;
  const payload = JSON.stringify({
    name: `Load User ${__VU}`,
    email: randomEmail,
  });

  const postParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const postRes = http.post(`${BASE_URL}/users`, payload, postParams);
  check(postRes, {
    'POST /users status is 201': (r) => r.status === 201,
  });

  sleep(0.5);
}

