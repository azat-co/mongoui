require('../public/css/highlight/sunburst.css')
require('../public/css/query.css')

let React = require('react')
let ReactDOM = require('react-dom')
let {Alert, Row, Form, FormGroup, FormControl, ControlLabel, Glyphicon, Button, Popover, Modal, OverlayTrigger} = require('react-bootstrap')
let equal = require('deep-equal')
let Highlight = require('react-highlight')

const Query = React.createClass({
  getInitialState() {
    return {
      showModal: false,
      query: {},
      keyInput: '',
      valueInput: '',
      showEdit: false
    }
  },
  componentWillReceiveProps(nextProps){
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
    // validate regular expressions - they will need to be constructed again from JSON string at index.js
    try{
      if ((val[0] == "R" && val[1] == "/") //arbitrary letter 'R' used by this app
        && (val.length > 3)   //avoids a few corner cases
        && ((val[(val.length - 1) ] == "/" ) || (val[(val.length - 2)] == "/") || (val[val.length - 3 ] == "/" )|| (val[val.length - 4 ] == "/"  ))
      ){
        var splitRegex = val.split("/")
        var makeRegex = new RegExp( splitRegex[1], splitRegex[2])
      }
    }catch(error){
      this.setState({errorMessage: 'Your RegExp Syntax could not be parsed'}, ()=>{
          setTimeout(this.clearErrorMessage, 4000)
      })  
      return false
    }
    ///
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
  },
  removeCondition() {
    let query = this.state.query
    let key = this.state.keyInput.trim()
    if (!key) return false
    delete query[key]
    this.setState({query: query, keyInput: '', valueInput: ''})
  },
  apply(event) {
    if(this.state.showEdit) {
      this.handleClick(event)
    } else {
      this.props.applyQuery(this.state.query)
      this.setState({ showModal: false })
    }
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
  clearAllModal(){
    this.setState({queryStr:""})
    if (this.state.showEdit) { this.toggleEdit() }
    this.setState({query:{}})
  },
  toggleEdit() {
    console.log('toggleEdit')
    this.setState({ showEdit: !this.state.showEdit, queryStr: JSON.stringify(this.state.query, null, 2)})
    document.addEventListener('click', this.handleClick, false);
  },
  convertToJSON(queryStr) {
    let queryObj
    try {
      queryObj = JSON.parse(queryStr)
    } catch(error) {
      try {
        eval('queryObj = ' + queryStr)
        console.log(queryObj)
        return queryObj
      }
      catch(error) {
        console.error(error)

      }
    } finally {
      console.log(queryObj)
      return queryObj
    }
  },
  clearErrorMessage() {
    this.setState({errorMessage: ''})
  },
  handleModalClick() {
    if (this.state.showEdit) {
      this.handleClick()
    }
  },
  handleClick: function (e) {
    var component = ReactDOM.findDOMNode(this.refs.edit)
    if (this.state.showEdit && component != e.target) {
      // console.log('handleClick', this, this.state.showEdit)
      let query =  this.convertToJSON(this.state.queryStr)
      if (query) {

        this.setState({showEdit: false, query: query}, ()=>{
          this.props.applyQuery(query)
        })
        document.removeEventListener('click', this.handleClick, false);
        return;
      } else {
        this.setState({errorMessage: 'Please check your object literal/JSON format'}, ()=>{
          setTimeout(this.clearErrorMessage, 4000)
        })
      }
    }
  },
  handleEditChange(event){
    this.setState({queryStr: event.target.value})
  },
  render() {
    // let popover = <Popover title="popover">very popover. such engagement</Popover>
    // let tooltip = <Tooltip>wow.</Tooltip>
    let isQueryApplied = (JSON.stringify(this.state.query) != '{}')
    let popover = <Popover id="query" title="Query Applied">{JSON.stringify(this.state.query, null, 2)}</Popover>
    let button = (
      <Button onClick={this.open} title="Query documents" bsSize="xsmall" bsStyle={(isQueryApplied)?'info':'default'}>
          <Glyphicon glyph="filter" />
      </Button>
    )
    let buttonClear = (
      <Button onClick={this.clear} title="Clear and Run Query" bsSize="xsmall" bsStyle={(isQueryApplied) ? 'danger':'default'}>
          <Glyphicon glyph="remove-circle" />
      </Button>
    )
    return (
      <div style={{display: 'inline'}}>
      {(isQueryApplied)? <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={popover}>
        {button}

        </OverlayTrigger>: button}
        {(isQueryApplied) ? buttonClear : ''}
        <Modal show={this.state.showModal} onHide={this.apply} onClick={this.handleModalClick}>
          <Modal.Header closeButton>
            <Modal.Title>Query Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Simple query</h4>
            <p>To query by a key-value pair, enter them in a form below and click "Add"</p>
            <p>Use the same form and existing key/property to update an existing condition.</p>
            <p>Numbers will be automatically parsed as numbers. Put double quotes to enforce string type.</p>
            <p>Prefix /.../ syntax with an 'R' to filter with basic regular expressions. (i.e.: <code> R/^ma/i </code> for "mary" and "Mark", but not "Thomas")</p>
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


              <Button onClick={this.addCondition} title="Add/Update Condition" bsSize="small" bsStyle="success">
                <Glyphicon glyph="plus" />
              </Button>
              <Button  bsStyle="danger" onClick={this.removeCondition} title="Remove Condition by the key name" bsSize="small">
                <Glyphicon glyph="remove" />
              </Button>
              </Row>
            </Form>

            {(this.state.errorMessage)?<Alert bsStyle="danger">
            <p>{this.state.errorMessage}</p>
            </Alert>
            :''}
            <hr/>
            <h4>Already applied conditions in the query</h4>
            <p>Click to edit as JS object literal or JSON</p>
          {(this.state.showEdit) ?
            <textarea
              value={this.state.queryStr}
              cols="50"
              rows="15"
              onChange={this.handleEditChange}
             ref="edit"/>
: <div className="edit" onClick={this.toggleEdit}><Highlight className='json' >
            {JSON.stringify(this.state.query, null, 2)}
          </Highlight></div>}

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.clearAllModal} bsStyle="danger" className="pull-left">Clear All</Button>
            <Button onClick={this.cancel}>Close</Button>
            <Button onClick={this.apply} bsStyle="primary">{(!this.state.showEdit)?'Close & Run Query': 'Parse Query'}</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = Query
