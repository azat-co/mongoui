var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let Document = require('./document.jsx')

let Docs = React.createClass({
  getInitialState(){
    console.log('hey')
    return {docs: []}
  },
  componentDidMount() {
    request({url: `${baseUrl}/api/dbs/${this.props.params.dbName}/collections/${this.props.params.collectionName}`,
      json: true,
      withCredentials: false},
      (error, response, body) =>{
        console.log(body)
        this.setState({docs: body.docs})
    })
  },
  render() {
    // console.log(this.state, this.props.params)
    return <div><PageHeader>Docs</PageHeader>{this.state.docs.map((doc)=>{
      return <Document document={doc} key={doc._id}/>
    })}
    <div>{this.props.children}</div>
    </div>
  }
})

module.exports = Docs
