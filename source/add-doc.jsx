let React = require('react')
let {Glyphicon, Button, Tooltip, Modal} = require('react-bootstrap')

const EditDoc = React.createClass({
  getInitialState() {
    return {
      showModal: false,
      docStr: JSON.stringify(this.props.doc, null, 2),
      errorMessage: '',
      validationMessage: ''
    }
  },
  propTypes: {
  },
  validate(event, callback){
    // console.log(this, e);
    let noParsingError = false
    let doc = null
    try {
      doc = JSON.parse(this.state.docStr)
      noParsingError = true
    } catch (error) {
      this.setState({errorMessage: 'Error parsing JSON, please check your syntax.' +error})
    } finally {
    }
    if (noParsingError && doc) {
      if (callback) return callback(doc)
      this.setState({validationMessage: 'It is a valid JSON!', docStr: JSON.stringify(doc, null, 2)})
      setTimeout(()=>{
        this.setState({validationMessage: ''})
      }, 400)
    }
  },
  add(event, ops =1) {
    this.validate({}, (doc)=>{
      this.props.addDoc(doc, ops, (operationMessage)=>{
        this.setState({operationMessage: operationMessage})
        setTimeout(()=>{
          this.setState({operationMessage: ''})
        }, 400)
      })
      this.setState({ showModal: false, docStr: '' })
    })
  },
  addNShow(){
    this.add({}, {show: true})
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
        <Button title="Add Document" onClick={this.open} bsSize="xsmall" bsStyle={'default'}>
            <Glyphicon glyph="plus" />
          {(this.state.operationMessage)?
          <Tooltip placement="bottom" className="in" id="operationMessageForAddDoc">
            {this.state.operationMessage}
          </Tooltip>:''}
        </Button>
        <Modal show={this.state.showModal} onHide={this.cancel}>
          <Modal.Header closeButton>
            <Modal.Title>Insert Doc</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Type valid JSON to add a document to {this.props.collectionName}.</p>
            <p>You can insert multiple documents by providing an array of objects.</p>
            <p>{(this.state.errorMessage)? this.state.errorMessage : ''}</p>
            <hr />
            <textarea
              value={this.state.docStr}
              cols="50"
              rows="20"
              onChange={this.handleChange}/>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>Cancel</Button>
            <Button onClick={this.validate}>Validate
                {(this.state.validationMessage)?
                <Tooltip placement="bottom" className="in" id="validationMessageForValidate">
                  {this.state.validationMessage}
                </Tooltip>:''}
            </Button>
            <Button onClick={this.add} bsStyle="primary">Validate & Add</Button>
            <Button onClick={this.addNShow} bsStyle="primary">Validate, Add & Show</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = EditDoc
