/** Native DOMException — thay thế package node-domexception đã deprecated */
const DOMException = globalThis.DOMException;

if (!DOMException) {
  throw new Error(
    "DOMException không khả dụng. Yêu cầu Node.js 18 trở lên."
  );
}

module.exports = DOMException;
module.exports.default = DOMException;
