var mysql = require('mysql');
var tunnel = require('tunnel-ssh');
var basePromise = require("../lib/basePromise");
var Promise = require("bluebird")

exports.dbconnection  = function(server) {
    return new Object({
            tunnelPort: 33333,          // can really be any free port used for tunneling

            /**
             * DB server configuration. Please note that due to the tunneling the server host
             * is localhost and the server port is the tunneling port. It is because the tunneling
             * creates a local port on localhost
             */
            dbServer: server || {
                host: '127.0.0.1',
                port: 33333,
                user: 'kaifa',
                password: 'kaifa',
                database: 'price_clouds'
            },

            /**
             * Default configuration for the SSH tunnel
             */
            tunnelConfig: {
                localHost:'127.0.0.1',
                remoteHost: '10.10.0.242', // mysql server host
                remotePort: 3306, // mysql server port
                localPort: 33333, // a available local port
                verbose: true, // dump information to stdout
                disabled: false, //set this to true to disable tunnel (useful to keep architecture for local connections)
                sshConfig: { //ssh2 configuration (https://github.com/mscdex/ssh2)
                    host: '120.92.137.47',
                    port: 60022,
                    username: 'ody',
                    password: 'bauCqj0cbue0,aD'
                    //privateKey: require('fs').readFileSync('<pathToKeyFile>'),
                    //pas120.92.137.47sphrase: 'verySecretString' // option see ssh2 config
                }
            },

            // tunnelConfig: {
            //     localHost:'127.0.0.1',
            //     remoteHost: 'dsmaster.odianyun.local', // mysql server host
            //     remotePort: 3306, // mysql server port
            //     localPort: 33333, // a available local port
            //     verbose: true, // dump information to stdout
            //     disabled: false, //set this to true to disable tunnel (useful to keep architecture for local connections)
            //     sshConfig: { //ssh2 configuration (https://github.com/mscdex/ssh2)
            //         host: '120.92.137.234',
            //         port: 60022,
            //         username: 'kaifa',
            //         password: 'UU0xtrb3s-'
            //         //privateKey: require('fs').readFileSync('<pathToKeyFile>'),
            //         //pas120.92.137.47sphrase: 'verySecretString' // option see ssh2 config
            //     }
            // },
            promise:function(){
                me = this;
                return new  Promise(function(resolve,reject){
               
                // Convert original Config to new style config:
                var config = me.tunnelConfig;

                var newStyleConfig = {
                    username: config.sshConfig.username,
                    password: config.sshConfig.password,
                    port: config.sshConfig.port,
                    host: config.sshConfig.host,
                    // SSH2 Forwarding...
                    dstPort:config.remotePort,
                    dstHost:config.remoteHost,
                    // dstPort: config.remotePort,
                    // dstHost: config.remoteHost,
                    srcPort: config.localPort,
                    srcHost: config.localHost,
                    // Local server or something...
                    localPort: config.localPort,
                    localHost: config.localHost,
                    // debug: console.log,
                    readyTimeout: 10000,
                    privateKey: config.privateKey
                }


                me.tunnel = tunnel(newStyleConfig, function (err,t) {
                        if (err) {
                            return reject(err);
                        }

                        console.log('Tunnel connected');

                        me.connection  = me.connect();
                        resolve(me.connection);
                    });
                })
            },

            /**
             * Initialise the mysql connection via the tunnel. Once it is created call back the caller
             *
             * @param callback
             */
            init: function (callback) {
    
                var me = this;

                // Convert original Config to new style config:
                var config = this.tunnelConfig;

                var newStyleConfig = {
                    username: config.sshConfig.username,
                    password: config.sshConfig.password,
                    port: config.sshConfig.port,
                    host: config.sshConfig.host,
                    // SSH2 Forwarding...
                    dstPort:config.remotePort,
                    dstHost:config.remoteHost,
                    // dstPort: config.remotePort,
                    // dstHost: config.remoteHost,
                    srcPort: config.localPort,
                    srcHost: config.localHost,
                    // Local server or something...
                    localPort: config.localPort,
                    localHost: config.localHost,
                    // debug: console.log,
                    readyTimeout: 10000,
                    privateKey: config.privateKey
                }


                me.tunnel = tunnel(newStyleConfig, function (err,t) {
                    console.log('Tunnel connected', err);
                    // console.log(t);
                    if (err) {
                        return callback(err);
                    }

                    me.connection  = me.connect();
                    // callback(me.connection)
                    //select distinct(TABLE_SCHEMA) from TABLES where TABLE_TYPE = 'BASE TABLE'

                    // basePromise.query("select * from t_category where id = 5549996",me.connection ).then((values) =>{
                    //     console.log(values);
                    //      me.connection.end();
                    // })
                });
            },


            /**
             * Mysql connection error handling
             *
             * @param err
             */
            errorHandler: function (err) {

                var me = this;
                //
                // Check for lost connection and try to reconnect
                //
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.log('MySQL connection lost. Reconnecting.');
                    me.connection = me.connect();
                } else if (err.code === 'ECONNREFUSED') {
                    //
                    // If connection refused then keep trying to reconnect every 3 seconds
                    //
                    console.log('MySQL connection refused. Trying soon again. ' + err);
                    setTimeout(function () {
                        me.connection = me.connect();
                    }, 3000);
                }
            },

            /**
             * Connect to the mysql server with retry in every 3 seconds if connection fails by any reason
             *
             * @param callback
             * @returns {*} created mysql connection
             */
            connect: function (callback) {

                var me = this;
                //
                // Create the mysql connection object
                //
                var connection = mysql.createConnection(me.dbServer);
                connection.on('error', me.errorHandler);
                //
                // Try connecting
                //
                connection.connect(function (err) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    console.log('Mysql connected as id ' + connection.threadId);
                    if (callback) callback();
                });

                return connection;
            }
        });

};


// this.dbconnection().promise().then((value,reject) =>{
//      basePromise.query("select * from TABLES",me.connection).then((values) =>{
//         console.log(me)
//         console.log(me.connection);
//         // console.log(values);
//         me.connection.end();
//     })
// })


