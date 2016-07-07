var {Label, Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Col} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let Connection = require('./connection.jsx')

module.exports = React.createClass({
  getInitialState(){
    return {databases: []}
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  fetch(){
    request({url: `${baseUrl}/api/dbs`, json: true, withCredentials: false}, (error, response, body) =>{
      if (response.statusCode != 200) {
        // console.error(error, response, body)
        if (response.body.indexOf('ECONNREFUSED')>-1) {
          this.setState({shorConnection: true})
        } else {
          // this.props.showErrorMessage(response.body)
        }
      } else {
        this.setState({databases: body.databases})
      }
    })
  },
  componentDidMount() {
    this.fetch()
  },
  componentWillReceiveProps(nextProps){
    console.log('content', nextProps)
    this.fetch()
  },
  render() {
    return <div>
      <Col md={2}>
        <PageHeader>Databases</PageHeader>
        {(this.state.shorConnection)?<Connection/>:''}
        {this.state.databases.map((database)=>{
          return <p key={database.name}>
          {/*<Link to={`/dbs/${database.name}`}>{database.name}</Link>*/}
            <a href={`#/dbs/${database.name}`}>
              {(database.name == this.props.params.dbName)?<Label>{database.name}</Label>:
                database.name
              }
            </a>
          </p>
        })}
      </Col>
      <Col md={10}>
        <div>{this.props.children}</div>
      </Col>
    </div>
  }
})
