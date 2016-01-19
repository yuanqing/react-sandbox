import React, { Component } from 'react';
import { render } from 'react-dom';

const style = require('./app.css');

class Hello extends Component {
  render() {
    return <div className={style.hello}>Hello, {this.props.name}!</div>;
  }
}

render(<Hello name="World" />, document.querySelector('.app'));
