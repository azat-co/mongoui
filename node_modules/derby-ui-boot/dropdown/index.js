// The create function is called after the component is created
// and has been added to the DOM. It only runs in the browser
exports.create = function(model, dom) {
  var toggle = dom.element('toggle')
    , menu = dom.element('menu')

  // Make sure the value gets set to the default if unselected
  updateValue(model, model.get('value'), true)

  // Listeners added inside of a component are removed when the
  // page is re-rendered client side
  dom.addListener(document.documentElement, 'click', function(e) {
    if (toggle.contains(e.target) || menu.contains(e.target)) return
    model.set('open', false)
  })
}

// The init function is called on both the server and browser
// before rendering
exports.init = function(model) {
  this.on('init:child', function(child, type) {
    if (type !== 'lib:option') return
    var childModel = child.model
    model.at('options').push({
      value: childModel.get('value')
    , text: childModel.get('content')
    })

    updateValue(model, model.get('value'))
  })

  updateValue(model, model.get('value'))

  model.on('set', 'value', function(value) {
    updateValue(model, value, true)
  })
}

exports.toggle = function() {
  this.model.set('open', !this.model.get('open'))
}

exports._clickMenu = function(e) {
  this.model.set('open', false)
  // Don't do anything unless an option was clicked
  if (e.target.tagName !== 'A') return
  var item = this.model.at(e.target)
    , value = item.get('value')
  if (value === void 0) value = item.get('text')
  this.model.set('value', value)
}

function optionValue(option) {
  return ('value' in option) ? option.value : option.text
}

function updateValue(model, value, setValue) {
  var options = model.get('options')
    , i, len, option
  if (!options) return
  for (i = 0, len = options.length; i < len; i++) {
    option = options[i]
    if (optionValue(option) !== value) continue
    model.set('label', option.text, null)
    return
  }
  option = options[0]
  value = optionValue(option)
  if (setValue || value === void 0) {
    model.set('value', value)
  }
  model.set('label', option.text, null)
}
