exports.init = function(model) {
  var tabs = this.tabs = model.at('tabs')
    , current = this.current = model.at('current')

  this.on('init:child', function(child, type) {
    if (type !== 'lib:tab') return
    var childModel = child.model
      , name = childModel.get('name') || tabs.get('length') || 0
      , title = childModel.get('title')
    tabs.push({name: name, title: title, model: childModel})
    this.select()
  })

  current.on('set', function(name) {
    var items = tabs.get()
      , i = items && items.length
      , tab
    while (i--) {
      tab = items[i]
      tab.model.set('active', tab.name == name)
    }
  })
}

exports.select = function(name) {
  if (name == null) name = this.current.get()
  if (name == null) name = this.tabs.get('0.name')
  this.current.set(name)
}

exports._clickTab = function(e, el) {
  $('.nav-tabs').find('li.active').removeClass('active');
  $('.tab-content').find('.active').removeClass('active');
  $(el).parent().addClass('active');
  $('.tab-content').find('.tab_' + $(el).attr('data-target')).addClass('active');
  this.select(this.model.at(el).get('name'));
}
