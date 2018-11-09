'use strict';

const fs = require('fs');
const ps = require('path');
const zlib = require('zlib');

let infoCache = {};

/**
 * 查询文件的 size 大小
 * @param {*} path
 */
let queryFileSize = async function (path) {
    return new Promise((resolve, reject) => {
        fs.exists(path, (exists) => {
            if (!exists) {
                return reject(`File does not exist - ${path}`);
            }

            fs.stat(path, (error, stat) => {
                resolve(stat.size);
            });
        });
    });
};

/**
 * 查询文件的 gzip 后的 size 大小
 * @param {*} path
 */
let queryFileZSize = async function (path) {
    return new Promise((resolve, reject) => {
        fs.exists(path, (exists) => {
            if (!exists) {
                return reject(`File does not exist - ${path}`);
            }

            fs.readFile(path, (error, data) => {
                if (error) {
                    return reject(`File cannot be read - ${path}`);
                }
                zlib.gzip(data, (error, data) => {
                    if (error) {
                        return reject(`The file cannot be compressed - ${path}`);
                    }
                    resolve(data.length);
                });
            });
        });
    });
};

/**
 * 查询资源基础的一些信息
 * @param {*} uuid
 */
let queryAssetInfo = async function (uuid) {
    if (infoCache[uuid]) {
        return infoCache[uuid];
    }
    return new Promise((resolve, reject) => {
        Editor.Ipc.sendToPanel('scene', 'scene:query-asset-info', uuid, async(error, info) => {
            if (error) {
                return reject(error);
            }
            if (!info) {
                // 找不到数据 / uuid 对应资源不存在
                return resolve(null);
            }
            try {
                info.size = await queryFileSize(info.path);
            } catch (error) {
                info.size = 0;
            }
            info.name = ps.basename(info.path);
            info.iconUrl = await queryMetaInfo(info.uuid, info.type);
            info.selected = true;

            infoCache[uuid] = info;

            try {
                info.zsize = await queryFileZSize(info.path);
            } catch (error) {
                info.zsize = 0;
            }

            resolve(info);
        });
    });
};

let queryMetaInfo = async function (uuid, type) {
    return new Promise((resolve, reject) => {
        let url, newImg, iconUrl;

        if (type === 'texture') {
            url = `thumbnail://${uuid}?32`;
            newImg = 'url("' + url + '")';
            iconUrl = `background-image:${newImg}`;
            resolve(iconUrl);
        } else if (type === 'sprite-frame') {
            Editor.assetdb.queryMetaInfoByUuid(uuid, (err, info) => {
                if (!info) {
                    iconUrl = `background-image:${_getDefaultIcon(type)}`;
                } else {
                    let meta = JSON.parse(info.json);
                    iconUrl = `background-image:${_getDrawFrameIcon(meta)}`;
                }
                resolve(iconUrl);
            });
        } else {
            iconUrl = `background-image:${_getDefaultIcon(type)}`;
            resolve(iconUrl);
        }
    });
};


let _getDrawFrameIcon = function (metaInfo) {
    let url = `thumbnail://${metaInfo.rawTextureUuid}?32`;

    // add parameters for the frame
    let x = metaInfo.trimX;
    let y = metaInfo.trimY;
    let w, h;
    let rotate = 0;
    if (metaInfo.rotated) {
        w = metaInfo.height;
        h = metaInfo.width;
        rotate = 270;
    }
    else {
        w = metaInfo.width;
        h = metaInfo.height;
    }
    let params = `&x=${x}&y=${y}&w=${w}&h=${h}`;
    if (rotate !== 0) {
        params += `&rotate=${rotate}`;
    }
    url += params;

    let newImg = 'url("' + url + '")';
    return newImg;
};


let _getDefaultIcon = function (type) {
    let url;
    let metaCtor = Editor.metas[type];
    if (metaCtor && metaCtor['asset-icon']) {
        url = metaCtor['asset-icon'];
        return 'url("' + url + '")';
    }

    // fallback to default icon
    url = 'packages://assets/static/icon/' + type + '.png';
    return 'url("' + url + '")';
};

module.exports = {
    queryFileSize,
    queryAssetInfo,
    queryMetaInfo,
};