let React = require('react')
let {FormGroup, FormControl, ControlLabel, Glyphicon, Badge, Button, Popover, Tooltip, Modal, OverlayTrigger} = require('react-bootstrap')
//   FormGroup
// const keyValueForm = React.createClass({
//   render() {
//     console.log('yo');
//     return <form inline>!!!
//       <FormGroup controlId="formInlineName">
//         <ControlLabel>Key/Property</ControlLabel>
//         {' '}
//         <FormControl type="text" placeholder="email" />
//       </FormGroup>
//       {' '}
//       <FormGroup controlId="formInlineEmail">
//         <ControlLabel>Value</ControlLabel>
//         {' '}
//         <FormControl type="text" placeholder="jane.doe@example.com" />
//       </FormGroup>
//       {' '}
//       <Button type="submit">
//         Add This Condition
//       </Button>
//     </form>
// }})
//
// console.log(keyValueForm);
const Query = React.createClass({
  getInitialState() {
    return { showModal: false }
  },
  propTypes: {
    applyQuery: React.PropTypes.func.isRequired
  },
  close() {
    this.props.applyQuery()
    this.setState({ showModal: false })
  },
  open() {
    this.setState({ showModal: true })
  },
  render() {
    let popover = <Popover title="popover">very popover. such engagement</Popover>
    let tooltip = <Tooltip>wow.</Tooltip>
    console.log(FormGroup, Modal);
    return (
      <div>
        <Button onClick={this.open} title="Query documents" bsSize="small"><Badge><Glyphicon glyph="filter" /></Badge></Button>
        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Query Collection</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Simple query</h4>
            <p>To query by a key-value pair, enter them in a form below and click close</p>

            <hr />
            <form inline>!!!
              <FormGroup controlId="formInlineName">
                <ControlLabel>Key/Property</ControlLabel>
                {' '}
                <FormControl type="text" placeholder="email" />
              </FormGroup>
              {' '}
              <FormGroup controlId="formInlineEmail">
                <ControlLabel>Value</ControlLabel>
                {' '}
                <FormControl type="text" placeholder="jane.doe@example.com" />
              </FormGroup>
              {' '}
              <Button type="submit">
                Add This Condition
              </Button>
            </form>

            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>

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
