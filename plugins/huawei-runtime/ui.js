'use strict';

/**
 * 显示记录的文件详细信息
 */
const fs = require('fs');
const path = require('path'); // path system
const dialog = require('electron').remote.dialog;
const huawei = require('./lib/huawei');

let phone = require(Editor.url('packages://runtime-dev-tools/utils/phone'));
let log = require(Editor.url('packages://runtime-dev-tools/utils/log'));
let info = require(Editor.url('packages://runtime-dev-tools/utils/info'));

exports.template = fs.readFileSync(Editor.url('packages://runtime-dev-tools/plugins/huawei-runtime/ui.html'), 'utf-8');

exports.name = "huawei-runtime";
exports.props = [];

exports.data = function () {
    return {
        rpkPath: huawei.rpkPath,
        uri: "",
        params: "",
        debug: true,
        maxWidth: 750//华为目前只支持750和464
    };
};

exports.watch = {};

exports.computed = {};

exports.methods = {
    t (key) {
        return Editor.T(key);
    },
    register_handler(){
        phone.on('add_device', async(id) => {
            if (huawei.needToCreatLogcat(id)) {
                await huawei.checkRuntime();
                huawei.openLogcat();
            }
        });

        phone.on('remove_device', (id) => {

        });
    },

    async installApk(){
        await huawei.installRuntime();
    },

    onChooseRpkPath (event) {
        event.stopPropagation();
        let res = Editor.Dialog.openFile({
            defaultPath: path.join(Editor.projectInfo.path, '/temp/android-instant-games/profiles'),
            properties: ['openFile'],
            filters: [
                {name: '华为 runtime rpk', extensions: ['rpk']}
            ],
        });

        if (res && res[0]) {
            this.rpkPath = res[0];
        }
    },

    getLaunchParams(){
        let params = ['--ei', 'debugmode', this.debug ? 2 : 1];
        if (this.uri) {
            params.push('--es');
            params.push('uri');
            params.push(encodeURIComponent(this.uri));
        }

        if (this.params) {
            params.push('--es');
            params.push('params');
            params.push(encodeURIComponent(this.params));
        }

        if (this.maxWidth != 750) {//华为默认750
            params.push('--es');
            params.push('maxwidth');
            params.push(parseInt(this.maxWidth));
        }
        return params.join(" ");
    },

    async launch(){
        await huawei.pushRpkToPhone(this.rpkPath);
        await huawei.startRuntimeWithRpk(path.basename(this.rpkPath), this.getLaunchParams());
    },

    async stop(){
        await huawei.stopRuntime();
    }
};

exports.created = async function () {
    this.register_handler();
    await huawei.checkRuntimeVersion();
    await huawei.checkRuntime();
    huawei.openLogcat();

};

exports.directives = {};