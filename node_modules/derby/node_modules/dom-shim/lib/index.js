var doc = document
  , elementProto = HTMLElement.prototype
  , nodeProto = Node.prototype

// Add support for Node.contains for Firefox < 9
if (!doc.contains) {
  nodeProto.contains = function(node) {
    return !!(this.compareDocumentPosition(node) & 16)
  }
}

// Add support for insertAdjacentHTML for Firefox < 8
// Based on insertAdjacentHTML.js by Eli Grey, http://eligrey.com
if (!doc.body.insertAdjacentHTML) {
  elementProto.insertAdjacentHTML = function(position, html) {
    var position = position.toLowerCase()
      , ref = this
      , parent = ref.parentNode
      , container = doc.createElement(parent.tagName)
      , firstChild, nextSibling, node

    container.innerHTML = html
    if (position === 'beforeend') {
      while (node = container.firstChild) {
        ref.appendChild(node)
      }
    } else if (position === 'beforebegin') {
      while (node = container.firstChild) {
        parent.insertBefore(node, ref)
      }
    } else if (position === 'afterend') {
      nextSibling = ref.nextSibling
      while (node = container.lastChild) {
        nextSibling = parent.insertBefore(node, nextSibling)
      }
    } else if (position === 'afterbegin') {
      firstChild = ref.firstChild
      while (node = container.lastChild) {
        firstChild = ref.insertBefore(node, firstChild)
      }
    }
  }
}

elementProto.matches =
  elementProto.webkitMatchesSelector ||
  elementProto.mozMatchesSelector ||
  elementProto.oMatchesSelector ||
  elementProto.msMatchesSelector
