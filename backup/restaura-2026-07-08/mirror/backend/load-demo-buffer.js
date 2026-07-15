'use strict';

const fs = require('fs');
const path = require('path');

function loadDemoBuffer() {
  const candidates = [
    path.join(__dirname, 'config', 'demo-buffer.json'),
    path.join(__dirname, '..', 'config', 'demo-buffer.json'),
  ];

  for (const bufPath of candidates) {
    try {
      if (fs.existsSync(bufPath)) {
        return {
          data: JSON.parse(fs.readFileSync(bufPath, 'utf8')),
          source: bufPath,
        };
      }
    } catch (err) {
      console.warn('demo-buffer read failed:', bufPath, err.message);
    }
  }

  try {
    return {
      data: require('./config/demo-buffer.json'),
      source: path.join(__dirname, 'config', 'demo-buffer.json') + ' (require)',
    };
  } catch (err) {
    console.warn('demo-buffer require failed:', err.message);
  }

  try {
    return {
      data: require('./config/demo-buffer.fallback.js'),
      source: 'config/demo-buffer.fallback.js (embedded)',
    };
  } catch (err) {
    console.warn('demo-buffer fallback failed:', err.message);
  }

  return { data: {}, source: 'none' };
}

module.exports = loadDemoBuffer;
