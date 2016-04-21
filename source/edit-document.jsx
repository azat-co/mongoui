let React = require('react')
let ReactDOM = require('react-dom')
let {Form, FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
let fD = ReactDOM.findDOMNode

const EditDocument = React.createClass({
  getInitialState() {
    return {
      showModal: false,
      documentStr: JSON.stringify(this.props.document, null, 2),
      errorMessage: '',
      operationMessage: ''
    }
  },
  propTypes: {
    applyEditDocument: React.PropTypes.func.isRequired,
    document: React.PropTypes.object.isRequired
  },
  applyEditDocument() {
    let noParsingError = false
    let doc = {}
    try {
      doc = JSON.parse(this.state.documentStr)
      noParsingError = true
    } catch (error) {
      this.setState({errorMessage: 'Error parsing JSON, please check your syntax.' +error})
    } finally {
    }
    if (noParsingError) {
      this.props.applyEditDocument(doc, this.props.index, (operationMessage)=>{
        this.setState({operationMessage: operationMessage})
        setTimeout(()=>{
          this.setState({operationMessage: ''})
        }, 400)
      })
      this.setState({ showModal: false })
    }
  },
  cancel(){
    this.setState({documentStr: JSON.stringify(this.props.document, null, 2), showModal: false})
  },
  open() {
    this.setState({ showModal: true })
  },
  handleChange(event){
    this.setState({documentStr: event.target.value, errorMessage: ''})
  },
  render() {
    // let popover = <Popover title="popover">very popover. such engagement</Popover>
    // let tooltip = <Tooltip>wow.</Tooltip>

    return (
      <div>
        <Button onClick={this.open} title="Edit documents" bsSize="small">
          <Badge>
            <Glyphicon glyph="edit" />
          </Badge>
        </Button>
        {(this.state.operationMessage)?
        <Tooltip placement="bottom" className="in" id="operationMessageforEditDocument">
          {this.state.operationMessage}
        </Tooltip>:''}

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Doc with ID {this.props.document._id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Type valid JSON to edit the document.</p>
            <p>{(this.state.errorMessage)? this.state.errorMessage : ''}</p>
            <hr />
            <pre>
              <textarea ref="documentInput"
                value={this.state.documentStr}
                cols="50"
                rows="20"
                onChange={this.handleChange}/>
            </pre>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>Cancel</Button>
            <Button onClick={this.applyEditDocument} bsStyle="primary">Apply</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = EditDocument
