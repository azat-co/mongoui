var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button, Collapse} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')

module.exports = React.createClass({
  getInitialState(){
    return {expanded: false}
  },
  toggleExpand(){
    this.setState({expanded: !this.state.expanded})
  },
  componentDidMount() {
    // request({url: `${baseUrl}/api/collections/${this.props.params.collectionName}`,
    //   json: true,
    //   withCredentials: false},
    //   (error, response, body) =>{
    //     console.log(body)
    //     this.setState({docs: body.docs})
    // })
  },

  render() {
    let document = this.props.document
    return  <div>
      <p key={document._id}><Button bsStyle="link" onClick={this.toggleExpand}>{document._id} <Badge><Glyphicon glyph="plus" /></Badge></Button></p>
      <Collapse in={this.state.expanded}>
        <div>{Object.keys(this.props.document).map((key)=>{
          return <p key={key}>{key}: {this.props.document[key]}</p>
        })}</div>
      </Collapse>
    </div>
  }
})
