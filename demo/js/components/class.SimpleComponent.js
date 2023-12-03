import Puer, {PuerComponent}   from '../../../puer.js'

class SimpleComponent extends PuerComponent {
	constructor(props, children) {
		super(props, children)
	}

	render() {
		return Puer.div({text: this.props.value})
	}
}

Puer.define(SimpleComponent)
export default SimpleComponent