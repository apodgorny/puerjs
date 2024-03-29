import $                  from '../core/class.Puer.js'

export default class DataOwnerMixin {
	static init(component, data) {
		component.props.require('name')
		component.props.require('dataSource')

		component._dataSet    = null
		component._dataSource = null
		component.dataSource  = component.props.dataSource
		if (component.dataSource.isPreloadable) {
			$.onDataMixinInit()
		}
	}

	set dataSource(name) {
		if (this._dataSet) {
			for (const id of this._dataSet.itemIds) {
				this.onDataItemRemove(id)
			}
		}
		const dsName = `${name}__${this.className}__${this.name}` + $.String.randomHex(3)
		// console.log(dsName)

		this.props.dataSource    = name
		this._dataSource         = $.DataSource[this.props.dataSource]
		this._dataSet            = $.DataSet.define(dsName, null, this.props.itemFilter, this.props.itemAdapter)
		this._dataSet.owner      = this
		
		const nop = () => {}
		const onDataFunction = this.props.onDataChange ? this.props.onDataChange : this.onDataChange ? this.onDataChange.bind(this) : nop

		const onData = (items) => {
			onDataFunction(items)
			if (this.dataSource.isPreloadable) {
				$.onDataMixinLoad()
			}
		}


		// TODO: Refactor churchkhela
		this._dataSet.onData       = onData
		this._dataSet.onSort       = this.props.onDataSort       ? this.props.onDataSort       : this.onDataSort       ? this.onDataSort.bind(this)       : nop
		this._dataSet.onFilter     = this.props.onDataFilter     ? this.props.onDataFilter     : this.onDataFilter     ? this.onDataFilter.bind(this)     : nop
		this._dataSet.onItemAdd    = this.props.onDataItemAdd    ? this.props.onDataItemAdd    : this.onDataItemAdd    ? this.onDataItemAdd.bind(this)    : nop
		this._dataSet.onItemChange = this.props.onDataItemChange ? this.props.onDataItemChange : this.onDataItemChange ? this.onDataItemChange.bind(this) : nop
		this._dataSet.onItemRemove = this.props.onDataItemRemove ? this.props.onDataItemRemove : this.onDataItemRemove ? this.onDataItemRemove.bind(this) : nop
		this._dataSet.onClear      = this.props.onDataClear      ? this.props.onDataClear      : this.onDataClear      ? this.onDataClear.bind(this)      : nop

	
		this._dataSet.dataSource = this._dataSource
	}

	get dataSource() {
		return this._dataSource
	}

	get dataSet() {
		return this._dataSet
	}
}
