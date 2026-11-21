const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');

test('invoice uses the checkout HSN rate when the order line has no gstRate', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, '');
  const order = {
    id: 1001,
    items,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  };
  const invoiced = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(invoiced.rows[0].gstPercent, 5);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.total, billed.total);
});

test('invoice matches checkout GST and total for a discounted HSN line', () => {
  const items = [
    { id: 1, name: 'Rice', hsn: '1006', gstRate: 5, price: 100, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const invoiced = invoice.computeInvoiceFigures({
    id: 1002,
    items,
    coupon: 'WELCOME',
    total: billed.total
  });

  assert.equal(billed.discount, 5);
  assert.equal(billed.tax, 4.75);
  assert.equal(billed.total, 99.75);
  assert.equal(invoiced.discount, billed.discount);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.total, billed.total);
  assert.equal(invoiced.rows[0].lineTax, billed.lines[0].tax);
});

test('invoice applies the checkout maximum discount cap', () => {
  const items = [
    { id: 1, name: 'Goods', gstRate: 5, price: 3000, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, 'WHOLESALE15');
  const invoiced = invoice.computeInvoiceFigures({
    id: 1003,
    items,
    coupon: 'WHOLESALE15',
    total: billed.total
  });

  assert.equal(billed.discount, 400);
  assert.equal(invoiced.discount, billed.discount);
  assert.equal(billed.total, 2730);
  assert.equal(invoiced.total, billed.total);
});

test('invoice uses a 12% HSN slab and matches the checkout GST split', () => {
  const items = [
    { id: 1, name: 'Ghee', hsn: '0405', price: 100, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, '');
  const invoiced = invoice.computeInvoiceFigures({ id: 1007, items });

  assert.equal(invoiced.rows[0].gstPercent, 12);
  assert.equal(invoiced.tax, billed.tax);
  assert.equal(invoiced.cgst, billed.cgst);
  assert.equal(invoiced.sgst, billed.sgst);
  assert.equal(invoiced.total, billed.total);
});
