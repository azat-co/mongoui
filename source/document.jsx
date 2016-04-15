var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button, Collapse, Tooltip} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let CopyToClipboard = require('react-copy-to-clipboard')

let Document = React.createClass({
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
      <p key={document._id}><Button bsStyle="link" onClick={this.toggleExpand}>{document._id} </Button>
        <Button><Badge><Glyphicon glyph="edit" /></Badge></Button>
        <CopyToClipboard text={JSON.stringify(document, null, 2)} onCopy={()=>{this.setState({copied: true}), setTimeout(()=>{this.setState({copied: false})}, 400)}}>
          <Button>
            <Badge>
              <Glyphicon glyph="copy" />
              {(this.state.copied)?
              <Tooltip placement="bottom" className="in">
                Copied!
              </Tooltip>:''}
            </Badge>
          </Button>
        </CopyToClipboard>
      </p>
      <Collapse in={this.state.expanded}>
        <div>{Object.keys(this.props.document).map((key)=>{
          if (typeof this.props.document[key] == 'object') return   <div key={key}>{key}: <pre>{JSON.stringify(this.props.document[key], null, 2)}</pre></div>
          else return <div key={key}>{key}: {this.props.document[key]}</div>
        })}</div>
      </Collapse>
    </div>
  }
})

module.exports = Document
