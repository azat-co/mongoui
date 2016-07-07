require('../public/css/highlight/sunburst.css')
require('../public/css/connection.css')

let React = require('react')
let ReactDOM = require('react-dom')
let {Alert, Row, Form, FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
let fD = ReactDOM.findDOMNode
let equal = require('deep-equal')
let Highlight = require('react-highlight')

const Connection = React.createClass({
  getInitialState() {
    let connections
    try {
      connections = JSON.parse(localStorage.getItem('mongoui-connections'))
    } catch(error) {

    }
    if (!Array.isArray(connections))
      connections = []
    return {
      showModal: true,
      uri: '',
      connections: connections
    }
  },
  handleUriChange(event) {
    this.setState({uri: event.target.value})
  },
  addConnection() {

    this.setState({
      connections: this.state.connections.concat([this.state.uri])
    }, ()=>{
      localStorage.setItem('mongoui-connections', JSON.stringify(this.state.connections))
    })

  },
  removeConnection(index) {
    console.log(this.state.uri, this.state.connections);
    console.log(index)
    return (event)=> {
      this.setState({connections: this.state.connections.slice(index, 1)}, ()=>{
        console.log(this.state.connections);
        localStorage.setItem('mongoui-connections', JSON.stringify(this.state.connections))
      })
    }
  },
  render() {
    return (
      <div style={{display: 'inline'}}>
        <Modal show={this.state.showModal} onHide={this.apply} onClick={this.handleModalClick}>
          <Modal.Header closeButton>
            <Modal.Title>Query Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Connections</h4>
            <p>Add MongoDB connection <a href="https://docs.mongodb.com/manual/reference/connection-string/" target="_blank">URI</a>. It will be stored in your browser's localstorage.</p>

            <hr />
            <Form inline onSubmit={this.addCondition}>
            <Row>
              <FormGroup controlId="formInlineName">
                <ControlLabel>URI:</ControlLabel>
                {' '}
                <FormControl
                  className="uri"
                  type="text"
                  placeholder='mongodb://azat:123456@localhost:27017/posts'
                  value={this.state.uri}
                  onChange={this.handleUriChange}/>
                {' '}
              </FormGroup>

              <Button type="submit" onClick={this.addConnection} title="Add" bsSize="small" bsStyle="success">
                <Glyphicon glyph="plus" />
              </Button>
              </Row>
            </Form>

            {(this.state.errorMessage)?<Alert bsStyle="danger">
            <p>{this.state.errorMessage}</p>
            </Alert>
            :''}
            <hr/>
            <h4>Your connections:</h4>
            {this.state.connections.map((connection, index)=><p key={index}>{connection}
              <Button  bsStyle="danger" onClick={this.removeConnection(index)} title="Remove connection by the key name" bsSize="small">
                <Glyphicon glyph="remove" />
              </Button>

            </p>)}



          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.cancel}>Close</Button>
            <Button onClick={this.apply} bsStyle="primary">{(!this.state.showEdit)?'Close & Run Query': 'Parse query'}</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
})

module.exports = Connection
