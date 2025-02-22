// customCodec.js
const msgpack = require('msgpack-lite');
const uuidParse = require('uuid-parse');
const { stringify: uuidStringify } = require('uuid');

const customCodec = msgpack.createCodec();

// Класс-обёртка для UUID с не перечисляемым свойством value
class TarantoolUuidExt {
  constructor(value) {
    this.value = value;
    Object.defineProperty(this, 'value', { enumerable: false });
  }
}

customCodec.addExtPacker(0x02, TarantoolUuidExt, (data) => {
  return uuidParse.parse(data.value);
});
customCodec.addExtUnpacker(0x02, (buffer) => {
  return uuidParse.unparse(buffer);
});

customCodec.addExtPacker(0x04, Date, (date) => {
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = date.getMilliseconds() * 1000;
  const buffer = Buffer.alloc(16);
  buffer.writeBigUInt64LE(BigInt(seconds), 0);
  buffer.writeUInt32LE(nanoseconds, 8);
  buffer.writeUInt32LE(0, 12);
  return buffer;
});
customCodec.addExtUnpacker(0x04, (buffer) => {
  const seconds = Number(buffer.readBigUInt64LE(0));
  const ms = Math.floor(buffer.readUInt32LE(8) / 1000);
  const date = new Date(seconds * 1000);
  date.setMilliseconds(ms);
  return date;
});

module.exports = {
  customCodec,
  TarantoolUuidExt
};
