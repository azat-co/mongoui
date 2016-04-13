let React = require('react')
let ReactDOM = require('react-dom')
let Navigation = require('./navigation.jsx')
let Content = require('./content.jsx')


ReactDOM.render(<Navigation/>, document.getElementById('navigation'))
ReactDOM.render(<Content/>, document.getElementById('content'))
module.hot.accept()
