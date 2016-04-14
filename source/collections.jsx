var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Col} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')

module.exports = React.createClass({
  getInitialState(){
    console.log('hey')
    return {collections: []}
  },
  componentDidMount() {
    request({url: `${baseUrl}/api/collections`, json: true, withCredentials: false}, (error, response, body) =>{
      // console.log(body);
      this.setState({collections: body.collections})
    })
  },
  render() {
    // console.log(this.state, this.props.params);
    return <div>
      <Col md={3}>
      <PageHeader>Collections</PageHeader>{this.state.collections.map((collection)=>{
      return <p key={collection.name}><Link to={`/dbs/${this.props.params.dbName}/collections/${collection.name}`}>{collection.name}</Link></p>
    })}</Col>
      <Col md={6}>
        <div>{this.props.children}</div>
      </Col>
    </div>
  }
})
