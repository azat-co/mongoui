var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button} = require('react-bootstrap')
let React = require('react')
let request = require('superagent')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let Document = require('./document.jsx')
let Query = require('./query.jsx')


let Docs = React.createClass({
  getInitialState(){
    console.log('hey')
    return {docs: []}
  },
  fetch(dbName, collectionName, query) {
    dbName = dbName || this.props.params.dbName
    collectionName = collectionName || this.props.params.collectionName
    query = query || {}
    let queryStr = JSON.stringify(query)
    console.log(query);
    window.request = ()=>{request({
      url: `${baseUrl}/api/dbs/${dbName}/collections/${collectionName}`,
      method: 'GET',
      json: query,
      qs: query,
      withCredentials: false},
      (error, response, body) =>{
        console.log(response, body)
        this.setState({docs: body.docs})
    })}
    window.request()
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    console.log('content')
    if (this.props.params.dbName != nextProps.params.dbName ||
      this.props.params.collectionName != nextProps.params.collectionName) this.fetch(nextProps.params.dbName, nextProps.params.collectionName)
  },
  applyQuery(query){
    this.fetch(null, null, query)
  },
  render() {
    // console.log(this.state, this.props.params)
    return <div>
      <PageHeader>Docs </PageHeader>

      <Query applyQuery={this.applyQuery} {...this.props}/>
      <span>[{this.props.params.collectionName}]</span>

        {this.state.docs.map((doc)=>{
          return <Document document={doc} key={doc._id}/>
        })}
        <div>{this.props.children}</div>
    </div>
  }
})

module.exports = Docs
