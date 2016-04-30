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
  toggle(node, toggle){
    if(this.state.cursor){this.state.cursor.active = false;}
    node.active = true;
    if(node.children){ node.toggled = toggled; }
    this.setState({ cursor: node });
  },
  renderObject(doc){
    // console.log(doc);
    let margin = {marginLeft: 20}
    if (Array.isArray(doc)) return <span>[ {doc.map((item, index, list)=>{
      let comma = (index<list.length-1) ? ',' : ''
      if (typeof item == 'object') return <div key={index}><div style={margin}>{this.renderObject(item)}</div></div>
      else if (index == 0) return <span key={index}>{this.showValue(item)} {comma}</span>
      else return <div key={index} style={margin}>{this.showValue(item)} {comma}</div>
    })}]</span>
    return <div>{Object.keys(doc).map((key)=>{
      if (Array.isArray(doc[key]))  return <div key={key}>{key}: <span>{this.renderObject(doc[key])}</span></div>
      else if (typeof doc[key] == 'object') return <div key={key}>{key}: <div style={{marginLeft: 20}}>{this.renderObject(doc[key])}</div></div>
      else return <div key={key}>{key}: {this.showValue(doc[key])}</div>
    })}</div>
    // return <div key={key}>{key}: <pre>{JSON.stringify(obj[key], null, 2)}</pre></div>
  },
  render() {
    let doc = this.props.doc
    let data = {
      name: doc._id,
      toggled: false,
      children: [doc]
    }
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
          {this.renderObject(doc)}
      </Collapse>
    </div>
  }
})

module.exports = Doc
