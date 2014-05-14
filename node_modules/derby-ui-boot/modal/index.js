exports.create = function(model, dom) {
  var self = this;

  dom.addListener(document, 'keydown', function(e) {
    if (e.keyCode === 27) {  // Escape
      self.close('escape')
    }
  })
}

exports.show = function() {
  this.model.set('show', true)
}

exports.close = function(action) {
  var cancelled = this.emitCancellable('close', action)
  if (!cancelled) this.model.set('show', false)
}

exports._click = function(e) {
  var action = e.target.getAttribute('data-action')
  if (action) this.close(action)
}
