var lessRoot = __dirname + '/node_modules/bootstrap/less/'
  , config = {
      ns: 'boot'
    , filename: __filename
    , scripts: {
        dropdown: require('./dropdown')
      , option: require('./dropdown/option')
      , modal: require('./modal')
      , tabs: require('./tabs')
      , tab: {}
      }
    }

module.exports = boot
boot.decorate = 'derby'

function boot(derby, options) {
  var outConfig = Object.create(config)
    , styles, outStyles, i, len, style

  if (options && 'styles' in options) {
    styles = options.styles
    if (typeof styles === 'string') styles = [styles]
    if (Array.isArray(styles)) {
      outStyles = []
      for (i = 0, len = styles.length; i < len; i++) {
        outStyles.push(lessRoot + styles[i]) 
      }
    }
  } else {
    outStyles = lessRoot + 'bootstrap'
  }
  outConfig.styles = outStyles
  derby.createLibrary(outConfig, options)
  return this
}
