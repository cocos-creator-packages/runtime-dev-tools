'use strict';

/**
 * 显示记录的文件详细信息
 */
const fs = require('fs');
const ps = require('path'); // path system

const Dialog = require('electron').remote.dialog;

exports.template = fs.readFileSync(ps.join(__dirname, '../template/console.html'), 'utf-8');

exports.props = [

];

exports.data = function () {
    return {};
};

exports.watch = {};

exports.computed = {};

exports.methods = {
    t (key) {
        return Editor.T(key);
    },


};

exports.created = function () {
};

exports.directives = {};