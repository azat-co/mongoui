let React = require('react')
let ReactDOM = require('react-dom')
let {Glyphicon, Button, Tooltip, Modal} = require('react-bootstrap')

const EditDoc = React.createClass({
  getInitialState() {
    return {
      showModal: false,
      docStr: JSON.stringify(this.props.doc, null, 2),
      errorMessage: '',
      operationMessage: ''
    }
  },
  propTypes: {
    applyEditDoc: React.PropTypes.func.isRequired,
    doc: React.PropTypes.object.isRequired
  },
  applyEditDoc() {
    let noParsingError = false
    let doc = {}
    try {
      doc = JSON.parse(this.state.docStr)
      noParsingError = true
    } catch (error) {
      this.setState({errorMessage: 'Error parsing JSON, please check your syntax.' +error})
    } finally {
    }
    if (noParsingError) {
      this.props.applyEditDoc(doc, this.props.index, (operationMessage)=>{
        this.setState({operationMessage: operationMessage})
        setTimeout(()=>{
          this.setState({operationMessage: ''})
        }, 400)
      })
      this.setState({ showModal: false, docStr: JSON.stringify(doc, null, 2) })
    }
  },
  deleteDoc() {
    let noParsingError = false
    let doc = {_id: this.props.doc._id}
    // We don't need to parse doc when deleting (it causes errors with binary fields), just use its ID
    this.props.deleteDoc(doc, this.props.index, (operationMessage)=>{
      this.setState({operationMessage: operationMessage})
      setTimeout(()=>{
        this.setState({operationMessage: ''})
      }, 400)
    })
    this.setState({ showModal: false, docStr: JSON.stringify(doc, null, 2) })

  },
  cancel(){
    this.setState({docStr: JSON.stringify(this.props.doc, null, 2), showModal: false})
  },
  open() {
    this.setState({ showModal: true })
  },
  handleChange(event){
    this.setState({docStr: event.target.value, errorMessage: ''})
  },
  render() {
    // let popover = <Popover title="popover">very popover. such engagement</Popover>
    // let tooltip = <Tooltip>wow.</Tooltip>

    return (
      <div style={{display: 'inline'}}>
        <Button onClick={this.open} title="Edit document" bsSize="xsmall">
            <Glyphicon glyph="edit" />
        </Button>
        {(this.state.operationMessage)?
        <Tooltip placement="bottom" className="in" id="operationMessageforEditDoc">
          {this.state.operationMessage}
        </Tooltip>:''}

        <Modal show={this.state.showModal} onHide={this.cancel}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Doc with ID {this.props.doc._id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Type valid JSON to edit the document.</p>
            <p>{(this.state.errorMessage)? this.state.errorMessage : ''}</p>
            <hr />
            <pre>
              <textarea
                value={this.state.docStr}
                cols="50"
                rows="20"
                onChange={this.handleChange}/>
            </pre>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.deleteDoc} className="pull-left" bsStyle="danger">Delete Document</Button>
            <Button onClick={this.cancel}>Cancel</Button>
            <Button onClick={this.applyEditDoc} bsStyle="primary">Apply</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = EditDoc
