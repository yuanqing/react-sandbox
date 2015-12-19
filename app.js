import { Component } from 'react';
import { render } from 'react-dom';

class Hello extends Component {
  render() {
    return <div>Hello, {this.props.name}!</div>;
  }
}

render(<Hello name="World" />, document.querySelector('.app'));
