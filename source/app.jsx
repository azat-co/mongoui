let React = require('react')
let ReactDOM = require('react-dom')
let Navigation = require('./navigation.jsx')
let Content = require('./content.jsx')
let Collections = require('./collections.jsx')
let Docs = require('./docs.jsx')
let { Router, Route, hashHistory } = require('react-router')

ReactDOM.render(<Navigation/>, document.getElementById('navigation'))
ReactDOM.render(<Router history={hashHistory}>
    <Route path="/" component={Content}>
      <Route path="/dbs/:dbName" component={Collections}>
        <Route path="/dbs/:dbName/collections/:collectionName" component={Docs}>
        </Route>
      </Route>
    </Route>
  </Router>, document.getElementById('content'))

if (module.hot) module.hot.accept()
