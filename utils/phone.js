const base = require('./base');
const adbKit = require('adbkit');
class phone extends base {
    constructor() {
        super();
        this.adb = adbKit.createClient();
        this.list = [];
        this.currentPhone = null;
        this.platform = null;
        this.init();
    }

    init() {
        return Promise.resolve().then(async() => {
            await this._initTracker();
        });
    }

    /**
     * 安装apk
     * @param id
     * @param apkPath
     * @returns {Promise.<void>}
     */
    async install(id, apkPath) {
        try {
            await this.adb.install(id, apkPath);
            console.log('install success');
        } catch (e) {

        }
    }

    /**
     * 执行adb shell 命令
     * @param id
     * @param command
     * @returns {Promise.<void>}
     */
    async shell(id, command) {
        try {
            await this.adb.shell(id, command);
        } catch (e) {

        }
    }

    /**
     * 执行adb push 命令
     * @param id
     * @param srcPath
     * @param destPath
     * @returns {Promise.<void>}
     */
    async push(id, srcPath, destPath) {
        return this.adb.push(id, srcPath, destPath);
    }

    /**
     * 启动手机插入拔出的监听
     * @private
     */
    async _initTracker() {
        let tracker = await this.adb.trackDevices();

        tracker.on('add', (device) => {
            this._addPhone(device);
            this.emit('add_device', device.id);
        });
        tracker.on('remove', (device) => {
            this._removePhone(device);
            this.emit('remove_device', device.id);
        });
        tracker.on('end', () => {
            console.log('Tracking stopped')
        });
    }

    /**
     * 获取手机列表
     * @returns {Promise.<Array>}
     */
    async getPhoneList() {
        let list = await this.adb.listDevices();
        list.forEach((item) => {
            this._addPhone(item);
        });
        this.currentPhone = list[0];
        return this.list;
    }

    _addPhone(item) {
        let same = this.list.find((ph) => {
            return ph.id === item.id;
        });
        if (!same) {
            this.list.push(item);
        }

        if (this.list.length === 1) {
            this.currentPhone = this.list[0];
        }
    }

    _removePhone(item) {
        let rph = this.list.find((ph) => {
            return ph.id === item.id;
        });

        if (rph) {
            this.list.splice(this.list.indexOf(rph), 1);
            if (this.list.indexOf(this.currentPhone) === -1) {
                this.currentPhone = this.list[0];
            }
        }

    }
}

module.exports = new phone();