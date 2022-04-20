const fastify = require('fastify')({
    logger: true
})
const to = require('await-to-js').default
const request = require("request-promise");
const fs = require("fs");
const chalk = require("chalk");
const checkConfig = function(sth){
    const isArray = Array.isArray(sth) && sth.length > 0
    if(!isArray){
        return false
    }
    const itemIsObject = typeof sth[0] === 'object' && sth[0] !== null && Object.keys(sth).length > 0
    return isArray && itemIsObject
}
fastify.register(
    require('fastify-helmet'),
    // Example disables the `contentSecurityPolicy` middleware but keeps the rest.
    { contentSecurityPolicy: false }
)
fastify.register(
    require('fastify-cors'),
    {
        optionsSuccessStatus:204
    }
)

module.exports = class EasyProxy{
    constructor({port,ip,configPath}){
        this.ip=ip
        this.port=port || process.env.PORT || 3000
        this.configPath =configPath
        const routeConfig = this.readConfig()
        this.init(routeConfig)
        return this
    }
    readConfig(){
        let data = ''
        try{
            data = fs.readFileSync(this.configPath, 'utf8')
            if(data.startsWith('export default')){
                data = data.replace('export default','module.exports =')
            }
            fs.writeFileSync(this.configPath,data)
            data = require(this.configPath)
        }catch(err){
            console.log(chalk.red(`${this.configPath} is not vailid`))
            process.exit(1)
            return
        }
        return data
    }
    init(routeConfig){
        if(!checkConfig(routeConfig)){
            console.log(chalk.red("routeConfig is not valid"))
            process.exit(0);
            return
        }

        if(!routeConfig[0].method){
            console.log(chalk.red("routeConfig must has method"))
            process.exit(0);
            return
        }
        if(!routeConfig[0].url){
            console.log(chalk.red("routeConfig must has url"))
            process.exit(0);
            return
        }
        if(!routeConfig[0].target){
            console.log(chalk.red("routeConfig must has target"))
            process.exit(0);
            return
        }
        routeConfig.forEach(({method,url,target,staticData,beforeSend,afterSend,headers,json}) => {
            const handler = async function(req, reply){
                beforeSend && await beforeSend(req, reply)
                if(staticData){
                    reply.send(staticData)
                    return
                }
                const options = {
                    method,
                    uri:target+url,
                    json:json || false
                }
                headers && (options.headers = headers);
                (req.query&&Object.keys(req.query).length) && (options.qs = req.query);
                (req.body && method.toLowerCase() !== 'get') && (options.body = req.body);
                const [err,res] = await to(request(options))
                afterSend && await afterSend(req, reply)
                return reply.send(res||err)
            }
            fastify.route({
                method,
                url,
                handler
            })
        })
        this.start()
    }
    start(){
        fastify.listen(this.port,'0.0.0.0',err => {
            if (err) {
                fastify.log.error(err)
                process.exit(1)
            }
            console.log(chalk.green(`server listening on ${this.ip}:${this.port}`))
        })

    }
    destroy(){
        fastify.close()
    }
}
