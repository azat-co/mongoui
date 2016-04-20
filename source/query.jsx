let React = require('react')
let ReactDOM = require('react-dom')
let {Form, FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
let fD = ReactDOM.findDOMNode

const Query = React.createClass({
  getInitialState() {
    return { showModal: false, query: {} }
  },
  propTypes: {
    applyQuery: React.PropTypes.func.isRequired
  },
  addCondition() {
    let query = this.state.query
    query[fD(this.refs.keyInput).value] = fD(this.refs.valueInput).value
    this.setState({query: query}, ()=>{
      fD(this.refs.keyInput).value=''
      fD(this.refs.valueInput).value = ''
    })
  },
  removeCondition() {
    let query = this.state.query
    let key = fD(this.refs.keyInput).value
    if (!key) return false
    delete query[key]
    this.setState({query: query})
  },
  close() {
    this.props.applyQuery(this.state.query)
    this.setState({ showModal: false })
  },
  open() {
    this.setState({ showModal: true })
  },
  render() {
    // let popover = <Popover title="popover">very popover. such engagement</Popover>
    // let tooltip = <Tooltip>wow.</Tooltip>

    return (
      <div>
        <Button onClick={this.open} title="Query documents" bsSize="small"><Badge><Glyphicon glyph="filter" /></Badge></Button>
        {(JSON.stringify(this.state.query) != '{}') ? JSON.stringify(this.state.query, null, 2):''}
        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Query Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Simple query</h4>
            <p>To query by a key-value pair, enter them in a form below and click "Add"</p>
            <p>Use the same form and existing key/property to update an existing condition.</p>

            <hr />
            <Form inline>
              <FormGroup controlId="formInlineName">
                <ControlLabel>Key/Property</ControlLabel>
                {' '}
                <FormControl type="text" placeholder="email" ref="keyInput" />
              </FormGroup>
              {' '}
              <FormGroup controlId="formInlineEmail">
                <ControlLabel>Value</ControlLabel>
                {' '}
                <FormControl type="text" placeholder="jane.doe@example.com" ref="valueInput"/>
              </FormGroup>
              {' '}
              <Button type="submit" onClick={this.addCondition}>
                Add/Update Condition
              </Button>
              <Button  bsStyle="danger" onClick={this.removeCondition}>
                Remove Condition by the key name
              </Button>
            </Form>

            <hr/>
            <h4> Already applied conditions in the query</h4>
            <pre>{JSON.stringify(this.state.query, null, 2)}</pre>


          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = Query
