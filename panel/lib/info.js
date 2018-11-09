'use strict';

const fs = require('fs');
const ps = require('path'); // path system

////////////////////
// info 数据管理器


/**
 * 读取保存的 json 数据
 * @param {*} path
 */
let readJson = function (path) {

    let timelinePath = ps.join(path, 'packageInfo.json');

    let json = {first: {scope: 1, items: []}, addList: [], removeList: []};
    if (fs.existsSync(timelinePath)) {
        let str = fs.readFileSync(timelinePath, 'utf-8');
        try {
            json = JSON.parse(str);
        } catch (error) {
            console.warn(error);
        }
    }

    return json;
};

/**
 * 获取某个记录的记录进度百分比
 * @param path
 */
let queryScope = function (path) {
    return readJson(path).first.scope;
};

/**
 * 保存用户修改后的数据
 * @param {*} path
 * @param {*} json
 */
let saveJson = function (path, json) {
    let dirname = path;
    let mkdirSync = function (dir) {
        if (fs.existsSync(dir)) {
            return true;
        }

        let ndir = ps.dirname(dirname);
        if (!fs.existsSync(ndir)) {
            mkdirSync(ndir);
        }
        ps.mkdirSync(dir);
        return true;
    };
    mkdirSync(dirname);

    let str = JSON.stringify(json);
    fs.writeFileSync(ps.join(dirname, 'packageInfo.json'), str);
    return true;
};

module.exports = {
    readJson,
    saveJson,
    queryScope,
};