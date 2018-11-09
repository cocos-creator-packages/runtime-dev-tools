'use strict';

/**
 * 显示记录的文件详细信息
 */
const fs = require('fs');
const ps = require('path'); // path system
const dialog = require('electron').remote.dialog;
const huawei = require('./lib/huawei');

let phone = require(Editor.url('packages://runtime-dev-tools/utils/phone'));
exports.template = fs.readFileSync(Editor.url('packages://runtime-dev-tools/plugins/huawei-runtime/ui.html'), 'utf-8');

exports.props = [];

exports.data = function () {
    return {
        rpkPath: "/Users/wzm/Downloads/com.demo.huaweiexample.rpk"
    };
};

exports.watch = {};

exports.computed = {};

exports.methods = {
    t (key) {
        return Editor.T(key);
    },
    register_handler(){
        phone.on('add_device', (id) => {
            if (id != phone.currentPhone.id) {
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
            defaultPath: Path.join(Editor.projectInfo.path, '/temp/android-instant-games/profiles'),
            properties: ['openFile']
        });

        if (res && res[0]) {
            this.rpkPath = res[0];
        }
    },

    async onPushClick(){
        await huawei.pushRpkToPhone(this.rpkPath);
    },

    async startRuntime(){
        await huawei.startRuntimeWithRpk(1, 1);
    }

};

exports.created = async function () {
    await huawei.checkRuntimeVersion();

    huawei.openLogcat();
};

exports.directives = {};