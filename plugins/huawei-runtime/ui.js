'use strict';

/**
 * 显示记录的文件详细信息
 */
const fs = require('fs');
const ps = require('path'); // path system
const dialog = require('electron').remote.dialog;
const huawei = require('./lib/huawei');

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
    }

};

exports.created = function () {
    huawei.checkRuntimeVersion();
};

exports.directives = {};