pconst test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app } = require('../server');

test('health endpoint returns ok', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('customer registration stores a customer record', async () => {
  const server = app.listen(0);
  let createdCustomerId;

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aline Uwase',
        email: 'aline@example.com',
        phone: '+250788000000',
        location: 'Kigali',
        notes: 'Business account',
      }),
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    createdCustomerId = payload.id;
    assert.equal(payload.name, 'Aline Uwase');
    assert.equal(payload.email, 'aline@example.com');
    assert.ok(payload.id);
  } finally {
    if (createdCustomerId) {
      const customersFile = path.join(__dirname, '..', 'data', 'customers.json');
      const customers = JSON.parse(fs.readFileSync(customersFile, 'utf8'));
      fs.writeFileSync(customersFile, JSON.stringify(customers.filter((customer) => customer.id !== createdCustomerId), null, 2));
    }
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('every order includes a 1000 RWF standard delivery charge', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aline Uwase',
        contact: 'aline@example.com',
        pickup: 'Kigali',
        dropoff: 'Rubavu',
        details: 'Gift package',
        paymentMethod: 'cash_on_delivery',
        items: [{ itemType: 'package', label: 'Package delivery', price: 8000, qty: 1 }],
      }),
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.ok(payload.items.some((item) => item.label === 'Standard delivery' && Number(item.price) === 1000));
    assert.equal(payload.total, 9000);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('marketplace is public to browse but shop changes require seller or admin routes', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const browseResponse = await fetch(`${baseUrl}/api/shops`);
    assert.equal(browseResponse.status, 200);
    const publicShops = await browseResponse.json();
    assert.ok(Array.isArray(publicShops));
    for (const id of ['glow-cosmetics', 'home-comforts', 'wellness-corner', 'paper-trail', 'pet-pantry', 'table-talk']) {
      assert.ok(publicShops.some((shop) => shop.id === id), `Expected built-in shop ${id} in the marketplace API`);
    }

    const publicCreateResponse = await fetch(`${baseUrl}/api/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Public Shop', category: 'Groceries', location: 'Kigali' }),
    });
    assert.equal(publicCreateResponse.status, 404);

    const publicUpdateResponse = await fetch(`${baseUrl}/api/shops/fresh-basket`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Overwritten Shop' }),
    });
    assert.equal(publicUpdateResponse.status, 404);

    const unauthenticatedSellerResponse = await fetch(`${baseUrl}/api/seller/shops`);
    assert.equal(unauthenticatedSellerResponse.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('admin can remove marketplace products and shops', async () => {
  const server = app.listen(0);
  let baseUrl;
  let token;
  let shopId;

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'safesend123' }),
    });
    assert.equal(loginResponse.status, 200);
    token = (await loginResponse.json()).token;

    const createResponse = await fetch(`${baseUrl}/api/admin/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Admin removal test shop',
        category: 'Test',
        location: 'Kigali',
        products: [{ id: 'removal-test-product', name: 'Test product', price: '100 RWF', priceValue: 100 }],
      }),
    });
    assert.equal(createResponse.status, 201);
    shopId = (await createResponse.json()).id;

    const unauthorizedResponse = await fetch(`${baseUrl}/api/admin/shops/${shopId}/products/removal-test-product`, { method: 'DELETE' });
    assert.equal(unauthorizedResponse.status, 401);

    const productResponse = await fetch(`${baseUrl}/api/admin/shops/${shopId}/products/removal-test-product`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(productResponse.status, 200);
    assert.deepEqual((await productResponse.json()).products, []);

    const shopResponse = await fetch(`${baseUrl}/api/admin/shops/${shopId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(shopResponse.status, 200);
    shopId = null;
  } finally {
    if (shopId && baseUrl && token) {
      await fetch(`${baseUrl}/api/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('payment initiation validates provider and Rwanda mobile number before submitting to a real provider', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const response = await fetch(`${baseUrl}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'SS-1234',
        provider: 'mtn_mobile_money',
        amount: 5000,
        phone: '07800000',
        currency: 'RWF',
      }),
    });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.match(payload.error, /Rwanda|mobile|phone|provider/i);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
