var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Col} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')

module.exports = React.createClass({
  getInitialState(){
    return {databases: []}
  },
  fetch(){
    request({url: `${baseUrl}/api/dbs`, json: true, withCredentials: false}, (error, response, body) =>{
      console.log(body);
      this.setState({databases: body.databases})
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    console.log('content')
    this.fetch()
  },
  render() {
    return <div>
      <Col md={2}>
        <PageHeader>Databases</PageHeader>
        {this.state.databases.map((database)=>{
          return <p key={database.name}><Link to={`/dbs/${database.name}`}>{database.name}</Link></p>
        })}
      </Col>
      <Col md={10}>
        <div>{this.props.children}</div>
      </Col>
    </div>
  }
})
