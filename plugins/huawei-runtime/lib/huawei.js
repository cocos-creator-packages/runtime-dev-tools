'use strict';
const fs = require('fire-fs');
const path = require('fire-path');
const url = require('fire-url');
const network = require('./network');

let phone = require(Editor.url('packages://runtime-dev-tools/utils/phone'));
let log = require(Editor.url('packages://runtime-dev-tools/utils/log'));
let info = require(Editor.url('packages://runtime-dev-tools/utils/info'));
let base = require(Editor.url('packages://runtime-dev-tools/utils/base'));

//华为runtime下载路径
let RUNTIME_DOWNLOAD_PATH = Editor.url(`profile://global/download/runtime/huawei/`);

//华为runtime版本请求地址
const RUNTIME_REQUEST_URL = 'https://deveco.huawei.com/FastIDE/update/api/update/engineVersion/';

const RUNTIME_STATE = {
    free: 0,//空闲
    downloading: 1,//下载runtime
    installing: 2,//安装runtime
    pushing: 3,//推数据到手机
};

const RUNTIME_RPK_PATH = '/data/local/tmp/';
/**
 * 用来放跟华为相关的一些操作
 */
class huawei extends base {

    constructor() {
        super();
        this.state = RUNTIME_STATE.free;
        this.runtimeApkPath = null;
    }

    /**
     * 请求runtime的版本
     * @returns {Promise.<T>}
     */
    requestRuntimeVersion() {
        info.log('正在检测 runtime 版本');
        return network.get(RUNTIME_REQUEST_URL).then((ret) => {
            ret = ret.toString();
            return JSON.parse(ret);
        }).catch((e) => {
            console.error('requestRuntimeVersion error', e);
        });
    }

    /**
     * 判断本地版本的runtime，如果没有，那么就下载
     * @returns {Promise.<void>}
     */
    async checkRuntimeVersion() {
        let version = await this.requestRuntimeVersion();
        let urlParam = version.url.split('/');
        let runtimeVersion = urlParam[urlParam.length - 1];
        info.log(`当前最新 runtime 版本:${runtimeVersion}`);

        let filePath = path.join(RUNTIME_DOWNLOAD_PATH, runtimeVersion);
        if (!fs.existsSync(filePath)) {
            info.log(`本地不存在 ${version} 的 runtime，开始下载`);
            fs.ensureDirSync(RUNTIME_DOWNLOAD_PATH);
            this._downloadRuntimeApk(version.url, filePath);
        }
        this.runtimeApkPath = filePath;
    }

    /**
     * 下载runtime的apk
     * @param url
     * @param path
     * @private
     */
    _downloadRuntimeApk(url, path) {
        this.state = RUNTIME_STATE.downloading;
        network.download(url, path, (progress) => {
            info.log(`新版本 runtime 下载中 ${progress.toFixed(2) * 100}%`);
        }, (result) => {
            this.state = RUNTIME_STATE.free;
            info.log(`新版本 runtime 下载中完成`);
        });
    }

    /**
     * 检测手机的runtime版本
     */
    checkPhoneRuntimeVersion() {
        if (!phone.currentPhone) {
            info.warn('当前没有手机连接，请先连接手机');
        }
    }

    /**
     * 安装runtime
     * @returns {Promise.<void>}
     */
    async installRuntime() {
        if (!this.runtimeApkPath) {
            info.error('can\'t find runtime apk');
            return;
        }
        this.state = RUNTIME_STATE.installing;
        info.log('安装 runtime 中');
        await phone.install(phone.currentPhone.id, this.runtimeApkPath);
        this.state = RUNTIME_STATE.free;
        info.log('runtime 安装完成');
    }

    async pushRpkToPhone(path) {
        if (!phone.currentPhone) {
            info.warn('当前没有手机连接，请先连接手机');
            return;
        }
        info.log('开始推送');
        this.state = RUNTIME_STATE.pushing;
        let transfer = await phone.push(phone.currentPhone.id, path, RUNTIME_RPK_PATH + "com.demo.huaweiexample.rpk");
        transfer.on('progress', function (stats) {
            info.log(`推送中 ${stats.bytesTransferred} bytes`);
        });
        transfer.on('end', function () {
            this.state = RUNTIME_STATE.free;
            info.log('推送完成');
        });
        transfer.on('error', (data) => {
            this.state = RUNTIME_STATE.free;
            info.error('推送错误');
        });
    }

    /**
     * 启动runtime
     * @param path
     * @param param
     * @returns {Promise.<void>}
     */
    async startRuntimeWithRpk(path, param) {
        info.log('启动 runtime 中');
        await phone.shell(phone.currentPhone.id, `adb shell am start --es rpkpath ${path} --ei ${param} --activity-clear-top com.huawei.fastapp.dev/com.huawei.fastapp.app.RpkRunnerActivity`);
        info.log('启动 runtime 完成');
    }

    /**
     * 停止runtime
     * @returns {Promise.<void>}
     */
    async stopRuntime() {
        info.log('停止 runtime');
        await phone.shell(phone.currentPhone.id, 'adb shell am force-stop com.huawei.fastapp.dev');
    }

}

module.exports = new huawei();