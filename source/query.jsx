let React = require('react')
let ReactDOM = require('react-dom')
let {Form, FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
let fD = ReactDOM.findDOMNode
var Highlight = require('react-highlight');

const Query = React.createClass({
  getInitialState() {
    return { showModal: false, query: {}, keyInput: '', valueInput: '' }
  },
  propTypes: {
    applyQuery: React.PropTypes.func.isRequired
  },
  handleKeyInputChange(event){
    this.setState({keyInput: event.target.value})
  },
  handleValueInputChange(event){
    this.setState({valueInput: event.target.value})
  },
  addCondition() {
    let query = this.state.query
    let num = null
    let val = this.state.valueInput.trim()
    let enforceString = false
    if (val[0] == '"' && val[val.length-1]=='"') {
      val = val.substr(1, val.length -2)
      enforceString = true
    } else {
      try {
        num = parseFloat(val)
      } catch(error) {
      }
    }
    if (!enforceString && num) query[this.state.keyInput] = num
    else if (val.toLowerCase() === 'true' || val.toLowerCase() === 'false') query[this.state.keyInput] = (val === 'true') ? true : false
    else query[this.state.keyInput] = val
    this.setState({query: query, keyInput: '', valueInput: ''})
    // query[fD(this.refs.keyInput).value] = fD(this.refs.valueInput).value
    // this.setState({query: query}, ()=>{
      // fD(this.refs.keyInput).value=''
      // fD(this.refs.valueInput).value = ''
    // })
  },
  removeCondition() {
    let query = this.state.query
    // let key = fD(this.refs.keyInput).value
    let key = this.state.keyInput.trim()
    if (!key) return false
    delete query[key]
    this.setState({query: query, keyInput: '', valueInput: ''})
  },
  apply() {
    this.props.applyQuery(this.state.query)
    this.setState({ showModal: false })
  },
  cancel(){
    this.setState({ showModal: false })
  },
  open() {
    this.setState({ showModal: true })
  },
  render() {
    // let popover = <Popover title="popover">very popover. such engagement</Popover>
    // let tooltip = <Tooltip>wow.</Tooltip>
    let isQueryApplied = (JSON.stringify(this.state.query) != '{}')
    let popover = <Popover id="query" title="Query Applied">{JSON.stringify(this.state.query, null, 2)}</Popover>
    let button = (
      <Button onClick={this.open} title="Query documents" bsSize="small" bsStyle={(isQueryApplied)?'info':'default'}>
        <Badge>
          <Glyphicon glyph="filter" />
        </Badge>
      </Button>
    )
    return (
      <div style={{display: 'inline'}}>
      {(isQueryApplied)? <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={popover}>
        {button}
        </OverlayTrigger>: button}
        <Modal show={this.state.showModal} onHide={this.apply}>
          <Modal.Header closeButton>
            <Modal.Title>Query Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Simple query</h4>
            <p>To query by a key-value pair, enter them in a form below and click "Add"</p>
            <p>Use the same form and existing key/property to update an existing condition.</p>
            <p>Numbers will be automatically parsed as numbers. Put double quotes to enforce string type.</p>

            <hr />
            <Form inline onSubmit={this.addCondition}>
              <FormGroup controlId="formInlineName">
                <ControlLabel>Key:</ControlLabel>
                {' '}
                <FormControl type="text" placeholder='email' value={this.state.keyInput} onChange={this.handleKeyInputChange}/>
                {' '}
              </FormGroup>
              {' '}
              <FormGroup controlId="formInlineEmail">
                <ControlLabel>Value:</ControlLabel>
                {' '}
                <FormControl type="text" placeholder='"jane.doe@example.com"' value={this.state.valueInput} onChange={this.handleValueInputChange}/>
                {' '}
              </FormGroup>
              {' '}

            </Form>
            <br/>
            <Button type="submit" onClick={this.addCondition}>
              Add/Update Condition
            </Button>
            <Button  bsStyle="danger" onClick={this.removeCondition}>
              Remove Condition by the key name
            </Button>



            <hr/>
            <h4> Already applied conditions in the query</h4>

          <Highlight className='json'>
            {JSON.stringify(this.state.query, null, 2)}
          </Highlight>


          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>Cancel</Button>
            <Button onClick={this.apply} bsStyle="primary">Close & Apply</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = Query
