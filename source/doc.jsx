var {Navbar, NavItem, NavDropdown, Nav, MenuItem, PageHeader, Glyphicon, Badge, Button, Collapse, Tooltip} = require('react-bootstrap')
let React = require('react')
let request = require('request')
let baseUrl = 'http://localhost:3001'
let {Link} = require('react-router')
let CopyToClipboard = require('react-copy-to-clipboard')
let EditDoc = require('./edit-doc.jsx')

let Doc = React.createClass({
  getInitialState(){
    return {expanded: false}
  },
  toggleExpand(){
    this.setState({expanded: !this.state.expanded})
  },
  showValue(value) {
    if (typeof value == 'boolean')
      return value.toString()
    else if (typeof value == 'string')
      return `"${value.toString()}"`
    return value
  },
  render() {
    let doc = this.props.doc
    return  <div>
      <div key={doc._id}><Button bsStyle="link" onClick={this.toggleExpand}>{doc._id} </Button>
        <EditDoc doc={doc} applyEditDoc={this.props.applyEditDoc} index={this.props.index}/>
        <CopyToClipboard text={JSON.stringify(doc, null, 2)} onCopy={()=>{
          this.setState({copied: true}), setTimeout(()=>{this.setState({copied: false})}, 400)}
        }>
          <Button  bsSize="small">
            <Badge>
              <Glyphicon glyph="copy" />
              {(this.state.copied)?
              <Tooltip placement="bottom" className="in">
                Copied!
              </Tooltip>:''}
            </Badge>
          </Button>
        </CopyToClipboard>
      </div>
      <Collapse in={this.state.expanded}>
        <div>{Object.keys(this.props.doc).map((key)=>{
          if (typeof this.props.doc[key] == 'object') return   <div key={key}>{key}: <pre>{JSON.stringify(this.props.doc[key], null, 2)}</pre></div>
          else return <div key={key}>{key}: {this.showValue(this.props.doc[key])}</div>
        })}</div>
      </Collapse>
    </div>
  }
})

module.exports = Doc
