#!/usr/bin/env node
const args = require('yargs').argv;
const chalk = require('chalk');
const {port=3000,h=false,config}=args;
const EasyProxy = require('./easyProxy')
// const chokidar = require('chokidar');
const fs = require("fs");
const path = require("path");
// console.log(args)
const ip = require('ip').address('private','ipv4');
if(h){
    console.log(`
       --target:目标地址，必填
       --port:端口号 默认3000
       --h:帮助
    `)
    process.exit(0);
    return
}
if(!config){
    console.log(chalk.red('请输入配置文件路径 --config xxx.js'))
    process.exit(0);
    return
}
const configPath = path.resolve(__dirname,config);
try {
    fs.accessSync(configPath, fs.constants.R_OK)
} catch (err) {
    console.log(chalk.red(`${configPath} not found`))
    process.exit(1)
    return
}
global.proxyServer = new EasyProxy({port,ip,configPath});

// const watcher = chokidar.watch(configPath, {interval:2000});
// watcher.on('change', function(path,stats){
//     if(stats){
//         console.log(chalk.green(`${path} changed`))
//         global.proxyServer.destroy()
//         global.proxyServer = null
//         global.proxyServer = new EasyProxy({port,ip,configPath});
//     }
// })
