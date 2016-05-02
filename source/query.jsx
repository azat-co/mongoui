require('../public/css/highlight/sunburst.css')
let React = require('react')
let ReactDOM = require('react-dom')
let {Row, Form, FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
let fD = ReactDOM.findDOMNode
let equal = require('deep-equal')
let Highlight = require('react-highlight')

const Query = React.createClass({
  getInitialState() {
    return { showModal: false, query: {}, keyInput: '', valueInput: '' }
  },
  componentWillReceiveProps(nextProps){
    console.log('@@@', nextProps);
    if (nextProps.query && !equal(this.state.query, nextProps.query))
      this.setState({query: nextProps.query})
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
    let keyInput = this.state.keyInput.trim()
    if (val == '' || keyInput == '') return false
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
    if (!enforceString && num) query[keyInput] = num
    else if (val.toLowerCase() === 'true' || val.toLowerCase() === 'false') query[keyInput] = (val === 'true') ? true : false
    else query[keyInput] = val

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
  apply(event) {
    // event.preventDefault()
    this.props.applyQuery(this.state.query)
    this.setState({ showModal: false })
  },
  cancel(){
    this.setState({ showModal: false })
  },
  open() {
    this.setState({ showModal: true })
  },
  clear(){
    this.setState({query: {}}, ()=>{
      this.apply()
    })
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
    let buttonClear = (
      <Button onClick={this.clear} title="Clear and Run Query" bsSize="small" bsStyle={(isQueryApplied) ? 'danger':'default'}>
        <Badge>
          <Glyphicon glyph="remove-circle" />
        </Badge>
      </Button>
    )
    return (
      <div style={{display: 'inline'}}>
      {(isQueryApplied)? <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={popover}>
        {button}

        </OverlayTrigger>: button}
        {(isQueryApplied) ? buttonClear : ''}
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
            <Row>
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


              <Button type="submit" onClick={this.addCondition} title="Add/Update Condition" bsSize="small" bsStyle="success">
                <Glyphicon glyph="plus" />
              </Button>
              <Button  bsStyle="danger" onClick={this.removeCondition} title="Remove Condition by the key name" bsSize="small">
                <Glyphicon glyph="remove" />
              </Button>
              </Row>
            </Form>


            <hr/>
            <h4> Already applied conditions in the query</h4>

          <Highlight className='json'>
            {JSON.stringify(this.state.query, null, 2)}
          </Highlight>


          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>Close</Button>
            <Button onClick={this.apply} bsStyle="primary">Close & Run Query</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = Query
