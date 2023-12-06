import Puer from '../../puer.js'

import FormInput from './class.FormInput.js'

class InputHidden extends FormInput {
	constructor( ... args) {
		super( ... args)
		this.isHidden = true
	}

	validate() {}

	onReady() {}

	render() {
		this.input = Puer.input({ ... this.props, type: 'hidden' })
		return this.input
	}
}

Puer.define(InputHidden)
export default InputHidden