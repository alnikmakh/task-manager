const fastify = require('fastify');

const server = fastify();

server.post('/', async (request, reply) => {
  console.log('Incoming request');
  const payload = request.body;
  try {
    const promises = payload.claims.map((claim) => {
      return fetch('http://localhost:3000/manager/process-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: claim.id,
          status: 'SUCCESS',
        }),
      });
    });
    await Promise.allSettled(promises);
  } catch (error) {
    console.log('Failed to fetch request', error);
  }

  console.log('Response sent');
  return {
    message: 'OK',
  };
});

server.listen({ port: 3001 }, (err, address) => {
  if (err) throw err;
  console.log(`Server is running on ${address}`);
});
