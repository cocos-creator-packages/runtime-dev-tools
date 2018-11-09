'use strict';

///////////////////
// record 数据管理器

const fs = require('fs');
const ps = require('path'); // path system
const resource = require('../lib/resource');
const info = require('../lib/info');

let root = ps.join(Editor.projectInfo.path, 'temp', 'android-instant-games', 'profiles');

//未选、选中的资源列表
let selectedResources = null;
let lastResources = null;
let resObj = {};

let timelineData = null;

//当前手动删除和添加的列表
let removeList = [];
let addList = [];
/**
 * 读取 timeline.json 文件内的数据
 * 如果传入文件找不到，则给出一个空数组
 * @param {*} path
 */
let readJson = function (path) {
    let timelinePath = ps.join(path, 'timeline.json');

    let json = [];
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
 * 查询持续时间
 * 最后一个时间戳减去第一个时间戳
 */
let queryRecordMs = function (path) {
    let json = readJson(path);
    let first = json[0];
    let last = json[json.length - 1];
    return last.ts - first.ts;
};

/**
 * 加载数据，初始化或者切换录制记录的时候调用
 * @param path
 */
let loadData = async function (path) {
    let pkgInfo = info.readJson(path);
    timelineData = readJson(path);
    addList.length = 0;
    removeList.length = 0;

    for (let k in resObj) {
        delete resObj[k];
    }

    for (let i = 0; i < pkgInfo.addList.length; i++) {
        let uuid = pkgInfo.addList[i];
        let resItem = await resource.queryAssetInfo(uuid);
        resItem.selected = true;
        addList.push(resItem);
    }
    if (pkgInfo.removeList) {
        for (let i = 0; i < pkgInfo.removeList.length; i++) {
            let uuid = pkgInfo.removeList[i];
            let resItem = await resource.queryAssetInfo(uuid);
            resItem.selected = false;
            removeList.push(resItem);
        }
    }

};

/**
 * 查询 timeline 文件内的缩略图信息
 */
let queryRecordScreenshots = function (path) {
    let arr = readJson(path);

    arr = arr.filter((item) => {
        return !!item.screenshot;
    });
    arr = arr.map((item) => {
        return ps.join(path, item.screenshot);
    });

    return arr;
};

/**
 * 查询一个 timeline 内，指定百分比范围内有多少资源
 * @param {*} path
 * @param {*} percentage
 */
let queryRecordResources = async function (path, percentage) {
    let json = timelineData;

    let duration = queryRecordMs(path);
    let sTimestamp = json[0].ts;
    let eTimestamp = sTimestamp + Math.round(duration * percentage);

    selectedResources = [];
    lastResources = [];

    for (let i = 0; i < json.length; i++) {
        let item = json[i];

        if (item.items) {
            for (let j = 0; j < item.items.length; j++) {
                let res = item.items[j];

                if (res.uuid) {
                    let resItem = await resource.queryAssetInfo(res.uuid);
                    if (!resItem) continue;

                    resObj[resItem.uuid] = resItem;

                    if (addList.indexOf(resItem) !== -1) {
                        resItem.selected = true;
                    }
                    if (removeList.indexOf(resItem) !== -1) {
                        resItem.selected = false;
                    }

                    if (item.ts > eTimestamp) {
                        lastResources.push(resItem);
                    } else {
                        selectedResources.push(resItem);
                    }
                }
            }
        }
    }
    return querySelectedResource();
};

/**
 * 返回当前选择的所有资源
 * @returns {*}
 */
let querySelectedResource = function () {
    if (!selectedResources) return [];
    let newList = removeList.filter((item) => {
        if (selectedResources.indexOf(item) === -1) {
            return item;
        }
    });

    newList = newList.concat(addList.filter((item) => {
        if (selectedResources.indexOf(item) === -1) {
            return item;
        }
    }));

    return selectedResources.concat(newList);
};

/**
 * 返回当前未选的所有资源
 * @returns {*}
 */
let queryLastResource = function () {
    if (!lastResources) return [];
    let newList = removeList.filter((item) => {
        if (lastResources.indexOf(item) === -1) {
            return item;
        }
    });

    let newLastList = lastResources.filter(item => {
        if (addList.indexOf(item) === -1) {
            return item;
        }
    });

    return newList.concat(newLastList);
};

/**
 * 手动删除某个资源
 * @param uuid
 */
let moveToRemoveList = function (uuid) {
    if (!selectedResources) return;
    let item = selectedResources.find((sItem) => {
        return sItem.uuid === uuid;
    });

    item && removeList.indexOf(item) === -1 && removeList.push(item);

    let aItem = addList.find((sItem) => {
        return sItem.uuid === uuid;
    });

    aItem && addList.splice(addList.indexOf(aItem), 1);
    aItem && removeList.indexOf(aItem) === -1 && removeList.push(aItem);
};

/**
 * 手动添加某个资源
 * @param uuid
 */
let moveToAddList = function (uuid) {
    if (!lastResources) return;

    let rItem = removeList.find((sItem) => {
        return sItem.uuid === uuid;
    });
    if (rItem) {
        rItem.selected = true;
        removeList.splice(removeList.indexOf(rItem), 1);
        addList.indexOf(rItem) === -1 && addList.push(rItem);
    }

    let item = lastResources.find((sItem) => {
        return sItem.uuid === uuid;
    });

    if (item) {
        item.selected = true;
        addList.indexOf(item) === -1 && addList.push(item);
    }

};

/**
 * 对从asset panel手动拖拽资源进行处理
 * @param item
 * @returns {string}
 */
let addManualItem = function (item) {
    let ret = "fail";
    do {
        if (resObj[item.uuid]) {
            ret = "exist";
            break
        }

        resObj[item.uuid] = item;
        removeList.indexOf(item) !== -1 && removeList.splice(removeList.indexOf(item), 1);
        addList.indexOf(item) === -1 && addList.push(item);
        ret = "success";
    } while (false);
    return ret;
};

module.exports = {
    queryRecordMs,
    queryRecordScreenshots,
    queryRecordResources,
    querySelectedResource,
    queryLastResource,
    moveToRemoveList,
    moveToAddList,
    addManualItem,
    loadData,
    removeList,
    addList,
};