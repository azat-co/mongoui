var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')

module.exports = React.createClass({
  getInitialState(){
    console.log('hey')
    return {docs: []}
  },
  componentDidMount() {
    request({url: `${baseUrl}/api/collections/${this.props.params.collectionName}`,
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
      return <p key={doc._id}><Link to={`/dbs/${this.props.params.dbName}/collections/${this.props.params.collectionName}/docs/${doc._id}`}>{doc._id} <Badge><Glyphicon glyph="plus" /></Badge></Link></p>
    })}
    <div>{this.props.children}</div>
    </div>
  }
})
