var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let Document = require('./document.jsx')
let Filter = require('./query.jsx')


let Docs = React.createClass({
  getInitialState(){
    console.log('hey')
    return {docs: []}
  },
  fetch(dbName, collectionName) {
    dbName = dbName || this.props.params.dbName
    collectionName = collectionName || this.props.params.collectionName
    request({url: `${baseUrl}/api/dbs/${dbName}/collections/${collectionName}`,
      json: true,
      withCredentials: false},
      (error, response, body) =>{
        console.log(body)
        this.setState({docs: body.docs})
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    console.log('content')
    if (this.props.params.dbName != nextProps.params.dbName ||
      this.props.params.collectionName != nextProps.params.collectionName) this.fetch(nextProps.params.dbName, nextProps.params.collectionName)
  },
  render() {
    // console.log(this.state, this.props.params)
    return <div><PageHeader>Docs <Filter applyQuery={()=>{console.log('yo');}} {...this.props}/></PageHeader>
      {this.state.docs.map((doc)=>{
        return <Document document={doc} key={doc._id}/>
      })}
    <div>{this.props.children}</div>
    </div>
  }
})

module.exports = Docs
