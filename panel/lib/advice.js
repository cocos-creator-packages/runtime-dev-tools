'use strict';

const { EventEmitter } = require('events');

// change-preview { percentage: 50, src: 'xxx.png' } 预览图更新
// change-range { percentage: 50 } 选中范围

module.exports = new EventEmitter();