// https://www.rfc-editor.org/rfc/rfc6455
// tcp/ip a bi-directional full-duplex channel

//https://betterprogramming.pub/implementing-a-websocket-server-from-scratch-in-node-js-a1360e00a95f

// http upgrade request 
// websocket ping pong frame


// todo binary



const http = require("http")
const { EventEmitter } = require("events")
const crypto = require("crypto")

class WebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super()
    this.port = options.port || 4000
    this.GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    this.OPCODES = { text: 0x01, close: 0x08 } 
    this._init()
  }

  _init() {
    if (this._server) throw new Error("Server already initialized")

    this._server = http.createServer((req, res) => {
      const UPGRADE_REQUIRED = 426
      const body = http.STATUS_CODES[UPGRADE_REQUIRED]
      res.writeHead(UPGRADE_REQUIRED, {
        "Content-Type": "text/plain",
        "Uprade": "Websocket",
      }).end(body)
    })

    this._server.on("upgrade", (req, socket) => {
      this.emit("headers", req)

      if (req.headers.upgrade?.toLowerCase() !== "websocket") {
        socket.end("HTTP/1.1 400 Bad Request")
        return
      }

      const acceptKey = req.headers["sec-websocket-key"]
      const acceptValue = this._generateAcceptValue(acceptKey)

      const responseHeaders = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: Websocket",
        "Connection: Upgrade",
        `Sec-Websocket-Accept: ${acceptValue}`
      ]

      const responseString = responseHeaders.concat("\r\n").join("\r\n")
      socket.write(responseString)

      this.on("close", () => {
        console.log("closing...")
        socket.destroy()
      })

      socket.on("data", buffer => {
        this.emit("data", this.parseFrame(buffer), (data) => socket.write(this.createFrame(data)))
        
      })


    })
  }

  _generateAcceptValue(acceptKey) {
    return crypto.createHash("sha1").update(acceptKey + this.GUID, "binary").digest("base64")
  }

  listen(callback) {
    this._server?.listen(this.port, callback)
  }

  /**
   * @param {Buffer} buffer 
   */
  parseFrame(buffer) {  // transfrom big-endian
    console.log(buffer)
    const firstBuffer = buffer.readUint8(0)
    const opCode = firstBuffer & 0b00001111  // get the last 4 bits

    if (opCode === this.OPCODES.close) {
      this.emit("close")
      return null 
    } else if (opCode !== this.OPCODES.text) {
      return
    }

    // 只处理文本

    const secondByte = buffer.readUint8(1)
    let offset = 2
    let payloadLength = secondByte & 0b01111111
    console.log("payloadLength: ", payloadLength)

    if (payloadLength === 126) {
      offset += 2
    } else if (payloadLength === 127) {
      offset += 8
    }

    const isMaked = Boolean((secondByte >>> 7) & 0b00000001)
    if (isMaked) {
      const maskingKey = buffer.readUInt32BE(offset)
      offset += 4
      const payload = buffer.subarray(offset)
      const result = this._unmask(payload, maskingKey)
      return result.toString("utf-8")
    }

    return buffer.subarray(offset).toString("utf-8")
  }

  /**
   * 
   * @param {Buffer} payload 
   * @param {Number} maskingKey 
   */
  _unmask(payload, maskingKey) {
    const reuslt = Buffer.alloc(payload.length)

    for (let i = 0; i < payload.length; ++i) {
      const j = i % 4
      const maskingKeyByteShift =  j === 3 ? 0 : (3 - j) << 3
      const maskingKeyByte = (maskingKeyByteShift === 0 ? maskingKey : maskingKey >>> maskingKeyByteShift) & 0b11111111
      const transfromedBtye = maskingKeyByte ^ payload.readUint8(i)
      reuslt.writeUInt8(transfromedBtye, i)
    }

    return reuslt
  }


  createFrame(data) {
    // const payload = JSON.stringify(data) 

    const payloadByteLength = Buffer.byteLength(data)
    let payloadBytesOffset = 2
    let payloadLength = payloadByteLength

    if (payloadLength > 65535) {
      payloadBytesOffset += 8
      payloadLength = 127
    } else if (payloadLength > 125) {
      payloadBytesOffset += 2
      payloadLength = 126
    }

    const buffer = Buffer.alloc(payloadBytesOffset + payloadByteLength)

    buffer.writeUint8(0b10000001, 0)
    buffer[1] = payloadLength

    if (payloadLength === 126) {
      buffer.writeUint16BE(payloadByteLength, 2)
    } else if (payloadLength === 127) {
      buffer.writeBigUInt64BE(BigInt(payloadByteLength), 2)
    }

    buffer.write(data, payloadBytesOffset)
    return buffer
  }

  // binary 


}

const PROT = 4000
let number = 0
const server = new WebSocketServer({port: PROT})
server.on("headers", ({headers}) => console.log(headers))

server.on("data", (message, replyFunc) => {
  if (!message) return
  console.warn(++number)
  console.log(`Message: ${message}`)
  replyFunc(message)
})


server.listen(() => {
  console.log(`Websocket server listening on port ${server.port}`)
});





// /images/2023/websockete_frame

// | Opcode value  | Meaning |
// | :--------: | :------------- |
// | 0x00  | Denotes that this frame continues the payload from the previous frame  |
// | 0x01  | Denotes a text frame  |
// | 0x02  | Denotes a binary frame  |
// | 0x08  | Denotes that the client wants to close the connection  |
// | 0x09, 0x0a  | ping and pong frames - a heartbeat mechanism for ensuring the connection is still alive  |
// | 0x03 - 0x07, 0x0b - 0x0f  | Reserved for future use  |

