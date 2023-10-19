import Puer   from '../../../puer.js'
import {Page} from '../../../ui/index.js'


class FormPage extends Page {
	render() {
		return Puer.Form({validationUrl: '/validate'}, [
				Puer.FormField({label: 'Username'}, [
					Puer.FormInput({type: 'text', name: 'username', validationType: 'username'}),
				]),
				Puer.FormField({label: 'Password'}, [
					Puer.FormInput({type: 'password', name: 'password', validationType: 'password'}),
				])
			]
		)
	}
}

Puer.define(FormPage)
export default FormPage