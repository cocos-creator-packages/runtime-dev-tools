'use strict';

const fs = require('fs');
const phone = Editor.require('packages://runtime-dev-tools/utils/phone');

const home = Editor.require('packages://runtime-dev-tools/panel/component/home');

Editor.Panel.extend({

    listeners: {
        'panel-resize'() {
            this.vm.width = this.clientWidth;
        },
    },

    style: fs.readFileSync(Editor.url('packages://runtime-dev-tools/panel/style/index.css')),

    template: home.template,

    messages: {},

    run (args) {
        phone.platform = 'huawei-runtime';
    },

    ready () {
        phone.platform = 'huawei-runtime';
        //todo:因为有时候需要传入参数，但是run又在ready后面执行,而且如果没有参数就不执行run回调，所以只能做这个兼容
        process.nextTick(() => {
            this.vm = new Vue({
                el: this.shadowRoot,
                data: home.data(),
                components: home.components,
                created: home.created,
                methods: home.methods,
            });
            this.vm.width = this.clientWidth;
            this.vm.platform = this.platform;
        });
    },

    close () {

    },

    save (event) {

    }

});