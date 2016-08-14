var { Glyphicon, Button, Collapse, Tooltip } = require('react-bootstrap')
let React = require('react')
let CopyToClipboard = require('react-copy-to-clipboard')
let EditDoc = require('./edit-doc.jsx')

require('../public/css/doc.css')

let Doc = React.createClass({
  getInitialState(){
    return {expanded: false}
  },
  toggleExpand(){
    this.setState({expanded: !this.state.expanded})
  },
  showValue(value) {
    if (value == null)
     return 'null'
    else if (value == undefined)
      return 'undefined'
    else if (typeof value == 'boolean')
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
    if (Array.isArray(doc)) return <div>{doc.map((item, index, list)=>{
      let last = (index==list.length-1) ? ']' : ','
      let first = (index == 0) ? '[' : ''
      if (typeof item == 'object') return <div key={index}><div>{first}{this.renderObject(item)}{last}</div></div>
      else return <div key={index} >{first}{this.showValue(item)} {last}</div>

    })}</div>
    else return <div>{Object.keys(doc).map((key)=>{
      //doc[key] === Object(doc[key])
      if (typeof doc[key] == 'object' && doc[key] != null) return <div key={key}>{key}: <div style={{marginLeft: 20}}>{this.renderObject(doc[key])}</div></div>
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
    return  <div className="doc">
      <div key={doc._id}>
        <Button bsStyle="link" onClick={this.toggleExpand} title={(this.state.expanded)? 'Collapse' : 'Expand'}>{doc._id} </Button>
        <span className="doc-btns">
          <EditDoc doc={doc} applyEditDoc={this.props.applyEditDoc} deleteDoc={this.props.deleteDoc} index={this.props.index}/>
          <CopyToClipboard text={JSON.stringify(doc, null, 2)} onCopy={()=>{
            this.setState({copied: true}), setTimeout(()=>{this.setState({copied: false})}, 400)}
          }>
            <Button bsSize="xsmall" title="Copy document to clipboard">
                <Glyphicon glyph="copy" />
                {(this.state.copied)?
                <Tooltip placement="bottom" className="in">
                  Copied!
                </Tooltip>:''}
            </Button>
          </CopyToClipboard>
        </span>
      </div>

      <Collapse in={this.state.expanded}>
          {this.renderObject(doc)}
      </Collapse>
    </div>
  }
})

module.exports = Doc
