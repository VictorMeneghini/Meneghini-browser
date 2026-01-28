const net = require('net')
const tls = require('tls')

const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https'
}

class HttpClient {
  constructor(url) {
    const [protocol, rest] = url?.split("://") ?? []
    const [host, ...pathParts] = rest?.split("/") ?? []
    
    this.protocol = protocol
    this.host = host
    this.path = "/" + pathParts.join("/")
    this.port = protocol === PROTOCOLS.HTTPS ? 443 : 80
  }

  request() {
    return new Promise((resolve, reject) => {
      const isHttps = this.protocol === PROTOCOLS.HTTPS
      let responseData = ''
      
      const onConnect = () => {
        console.log(`Connected with ${this.host}:${this.port}`)
        
        const httpRequest = `GET ${this.path} HTTP/1.1\r\nHost: ${this.host}\r\nUser-Agent: telnet-js/1.0\r\nAccept: */*\r\nConnection: close\r\n\r\n`
        socket.write(httpRequest)
      }

      const socket = isHttps ? 
        tls.connect({host: this.host, port: this.port, rejectUnauthorized: false}, onConnect) :
        net.createConnection({ host: this.host, port: this.port }, onConnect)
      
      socket.on('data', (data) => {
        responseData += data.toString()
      });

      socket.on('error', (err) => {
        console.error('ERROR:', err);
        reject(err)
      });

      socket.on('end', () => {
        const [headersWithProtocol, body] = responseData.split('\r\n\r\n')

        const firstLine = headersWithProtocol.split('\r\n')[0]
        
        const [httpVersion, statusCode, ...rest] = firstLine.split(' ')
        const details = rest.join(' ')

        const headers = headersWithProtocol.split('\r\n').slice(1)

        const parsedHeaders = headers.reduce((acc, item) => {

          const [key, value] = item.split(':')

          if(!acc[key]) {
            acc[key.toLowerCase()] = value?.trim()
          }
          
          return acc

        }, {})

        const result = {
          body,
          headers: parsedHeaders,
          statusCode,
          httpVersion,
          details
        }

        resolve(result)

        console.log('Connection closed');
      });
    })
  }
}

new HttpClient('https://browser.engineering/examples/xiyouji.html').request().body


module.exports = HttpClient