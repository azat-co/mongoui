var {Navbar, NavItem, NavDropdown, Nav, MenuItem} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'

module.exports = React.createClass({
  getInitialState(){
    return {databases: []}
  },
  componentDidMount() {
    request({url: `${baseUrl}/api/dbs`, json: true, withCredentials: false}, (error, response, body) =>{
      console.log(body);
      this.setState({databases: body.databases})
    })
  },
  render() {
    return <div>{this.state.databases.map((database)=>{
      return <p key={database.name}>{database.name}</p>
    })}</div>
  }
})
