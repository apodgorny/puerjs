import $                  from '../core/class.Puer.js'
import PuerComponentMixin from '../core/class.PuerComponentMixin.js'


export default class DataOwnerMixin extends PuerComponentMixin {
	static init(component) {
		component.props.require('dataSource')

		component._dataSet    = null
		component._dataSource = null
		component.dataSource  = component.props.dataSource
	}

	set dataSource(name) {
		if (this._dataSet) {
			for (const id of this._dataSet.itemIds) {
				this.onDataRemoveItem(id)
			}
		}
		this.props.dataSource = name
		this._dataSource      = $.DataSource[this.props.dataSource]
		this._dataSet         = this._dataSource.defineDataSet(null, this.props.entryFilter)

		const nop = () => {}

		this._dataSet.onInit       = this.props.onDataInit       || this.onDataInit       ? this.onDataInit.bind(this)       : nop
		this._dataSet.onData       = this.props.onDataChange     || this.onDataChange     ? this.onDataChange.bind(this)     : nop
		this._dataSet.onSort       = this.props.onDataSort       || this.onDataSort       ? this.onDataSort.bind(this)       : nop
		this._dataSet.onFilter     = this.props.onDataFilter     || this.onDataFilter     ? this.onDataFilter.bind(this)     : nop
		this._dataSet.onAddItem    = this.props.onDataAddItem    || this.onDataAddItem    ? this.onDataAddItem.bind(this)    : nop
		this._dataSet.onChangeItem = this.props.onDataChangeItem || this.onDataChangeItem ? this.onDataChangeItem.bind(this) : nop
		this._dataSet.onRemoveItem = this.props.onDataRemoveItem || this.onDataRemoveItem ? this.onDataRemoveItem.bind(this) : nop
	}

	get dataSource() {
		return this._dataSource
	}
}