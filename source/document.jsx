var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')

module.exports = React.createClass({
  getInitialState(){
    return {expanded: false}
  },
  toggleExpand(){
    let expanded = this.state.expanded
    this.setState({expanded: !expanded})
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
  renderExpanded(){
    return <div>{Object.keys(this.props.document).map((key)=>{
      return <p key={key}>{key}: {this.props.document[key]}</p>
    })}</div>
  },
  render() {
    let document = this.props.document
    return  <div>
      <p key={document._id}><Button bsStyle="link" onClick={this.toggleExpand}>{document._id} <Badge><Glyphicon glyph="plus" /></Badge></Button></p>
      {(this.state.expanded)? this.renderExpanded() : ''}
    </div>
  }
})
