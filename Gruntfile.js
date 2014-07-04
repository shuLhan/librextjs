//{{{ var: source for foundation script
var src_foundation = [
	"src/Ext.js"
,	"src/version/Version.js"
,	"src/lang/String.js"
,	"src/lang/Number.js"
,	"src/lang/Array.js"
,	"src/lang/Function.js"
,	"src/lang/Object.js"
,	"src/lang/Date.js"
,	"src/class/Base.js"
,	"src/class/Class.js"
,	"src/class/ClassManager.js"
,	"src/class/Loader.js"
,	"src/lang/Error.js"
];
//}}}
//{{{ var: source for core script.
var src_core = src_foundation.concat ([
	"src/misc/JSON.js"
,	"src/Ext-more.js"
,	"src/util/Format.js"
,	"src/util/TaskRunner.js"
,	"src/util/TaskManager.js"
,	"src/perf/Accumulator.js"
,	"src/perf/Monitor.js"
,	"src/Support.js"
,	"src/util/DelayedTask.js"
,	"src/util/Event.js"
,	"src/EventManager.js"
,	"src/util/Observable.js"
,	"src/EventObject.js"
,	"src/dom/AbstractQuery.js"
,	"src/dom/AbstractHelper.js"
,	"src/dom/AbstractElement_static.js"
,	"src/dom/AbstractElement_insertion.js"
,	"src/dom/AbstractElement_style.js"
,	"src/dom/AbstractElement_traversal.js"
,	"src/dom/AbstractElement.js"
,	"src/dom/Helper.js"
,	"src/Template.js"
,	"src/XTemplateParser.js"
,	"src/XTemplateCompiler.js"
,	"src/XTemplate.js"
,	"src/dom/Query.js"
,	"src/dom/Element_anim.js"
,	"src/dom/Element_dd.js"
,	"src/dom/Element_fx.js"
,	"src/dom/Element_position.js"
,	"src/dom/Element_scroll.js"
,	"src/dom/Element_style.js"
,	"src/util/Positionable.js"
,	"src/dom/Element.js"
,	"src/dom/CompositeElementLite.js"
,	"src/dom/CompositeElement.js"
]);
//}}}
//{{{ var: source for all script.
var src_all = src_core.concat ([
	"src/util/HashMap.js"
,	"src/AbstractManager.js"
,	"src/ComponentManager.js"
,	"src/ComponentQuery.js"
,	"src/util/ProtoElement.js"
,	"src/PluginManager.js"
,	"src/util/Filter.js"
,	"src/util/AbstractMixedCollection.js"
,	"src/util/Sorter.js"
,	"src/util/Sortable.js"
,	"src/util/MixedCollection.js"
,	"src/fx/target/Target.js"
,	"src/fx/target/Element.js"
,	"src/fx/target/ElementCSS.js"
,	"src/fx/target/CompositeElement.js"
,	"src/fx/target/CompositeElementCSS.js"
,	"src/fx/target/Sprite.js"
,	"src/fx/target/CompositeSprite.js"
,	"src/fx/target/Component.js"
,	"src/fx/Queue.js"
,	"src/fx/Manager.js"
,	"src/fx/Animator.js"
,	"src/fx/CubicBezier.js"
,	"src/fx/Easing.js"
,	"src/draw/Color.js"
,	"src/draw/Draw.js"
,	"src/fx/PropertyHandler.js"
,	"src/fx/Anim.js"
,	"src/util/Animate.js"
,	"src/util/ElementContainer.js"
,	"src/util/Renderable.js"
,	"src/state/Provider.js"
,	"src/state/Manager.js"
,	"src/state/Stateful.js"
,	"src/rtl/util/Renderable.js"
,	"src/AbstractComponent.js"
,	"src/rtl/AbstractComponent.js"
,	"src/rtl/dom/Element_anim.js"
,	"src/rtl/dom/Element_insertion.js"
,	"src/rtl/dom/Element_position.js"
,	"src/rtl/dom/Element_scroll.js"
,	"src/rtl/dom/Element_static.js"
,	"src/rtl/EventObject.js"
,	"src/AbstractPlugin.js"
,	"src/Action.js"
,	"src/data/flash/BinaryXhr.js"
,	"src/data/Connection.js"
,	"src/Ajax.js"
,	"src/util/Floating.js"
,	"src/rtl/util/Floating.js"
,	"src/Component.js"
,	"src/layout/container/border/Region.js"
,	"src/ElementLoader.js"
,	"src/ComponentLoader.js"
,	"src/layout/SizeModel.js"
,	"src/layout/Layout.js"
,	"src/layout/container/Container.js"
,	"src/layout/container/Auto.js"
,	"src/ZIndexManager.js"
,	"src/Queryable.js"
,	"src/container/AbstractContainer.js"
,	"src/container/Container.js"
,	"src/layout/container/Editor.js"
,	"src/Editor.js"
,	"src/util/KeyMap.js"
,	"src/util/KeyNav.js"
,	"src/FocusManager.js"
,	"src/Img.js"
,	"src/util/Bindable.js"
,	"src/LoadMask.js"
,	"src/data/association/Association.js"
,	"src/ModelManager.js"
,	"src/layout/component/Component.js"
,	"src/layout/component/Auto.js"
,	"src/layout/component/ProgressBar.js"
,	"src/ProgressBar.js"
,	"src/ShadowPool.js"
,	"src/Shadow.js"
,	"src/app/EventDomain.js"
,	"src/app/domain/Component.js"
,	"src/app/EventBus.js"
,	"src/data/StoreManager.js"
,	"src/app/domain/Global.js"
,	"src/data/ResultSet.js"
,	"src/data/reader/Reader.js"
,	"src/data/reader/Json.js"
,	"src/data/writer/Writer.js"
,	"src/data/writer/Json.js"
,	"src/data/proxy/Proxy.js"
,	"src/data/Operation.js"
,	"src/data/AbstractStore.js"
,	"src/app/domain/Store.js"
,	"src/app/Controller.js"
,	"src/container/DockingContainer.js"
,	"src/toolbar/Fill.js"
,	"src/layout/container/boxOverflow/None.js"
,	"src/toolbar/Item.js"
,	"src/toolbar/Separator.js"
,	"src/button/Manager.js"
,	"src/layout/component/Dock.js"
,	"src/menu/Manager.js"
,	"src/util/ClickRepeater.js"
,	"src/layout/component/Button.js"
,	"src/util/TextMetrics.js"
,	"src/button/Button.js"
,	"src/layout/container/boxOverflow/Menu.js"
,	"src/layout/container/boxOverflow/Scroller.js"
,	"src/util/Offset.js"
,	"src/util/Region.js"
,	"src/dd/DragDropManager.js"
,	"src/layout/container/Box.js"
,	"src/layout/container/HBox.js"
,	"src/layout/container/VBox.js"
,	"src/toolbar/Toolbar.js"
,	"src/panel/AbstractPanel.js"
,	"src/panel/Header.js"
,	"src/dd/DragDrop.js"
,	"src/dd/DD.js"
,	"src/dd/DDProxy.js"
,	"src/dd/StatusProxy.js"
,	"src/dd/DragSource.js"
,	"src/panel/Proxy.js"
,	"src/panel/DD.js"
,	"src/util/Memento.js"
,	"src/layout/component/Body.js"
,	"src/panel/Panel.js"
,	"src/tip/Tip.js"
,	"src/tip/ToolTip.js"
,	"src/tip/QuickTip.js"
,	"src/tip/QuickTipManager.js"
,	"src/app/Application.js"
,	"src/rtl/tip/QuickTipManager.js"
,	"src/rtl/panel/Panel.js"
,	"src/rtl/dd/DD.js"
,	"src/rtl/panel/Header.js"
,	"src/rtl/layout/container/VBox.js"
,	"src/rtl/layout/container/HBox.js"
,	"src/rtl/layout/container/Box.js"
,	"src/rtl/layout/container/boxOverflow/Scroller.js"
,	"src/rtl/layout/container/boxOverflow/Menu.js"
,	"src/rtl/button/Button.js"
,	"src/rtl/layout/component/Dock.js"
,	"src/app/domain/Controller.js"
,	"src/direct/Provider.js"
,	"src/app/domain/Direct.js"
,	"src/button/Split.js"
,	"src/button/Cycle.js"
,	"src/chart/Callout.js"
,	"src/draw/CompositeSprite.js"
,	"src/draw/Surface.js"
,	"src/layout/component/Draw.js"
,	"src/draw/Component.js"
,	"src/chart/theme/Theme.js"
,	"src/chart/MaskLayer.js"
,	"src/chart/Mask.js"
,	"src/chart/Navigation.js"
,	"src/chart/Shape.js"
,	"src/chart/LegendItem.js"
,	"src/chart/Legend.js"
,	"src/chart/theme/Base.js"
,	"src/chart/Chart.js"
,	"src/chart/Highlight.js"
,	"src/chart/Label.js"
,	"src/chart/TipSurface.js"
,	"src/chart/Tip.js"
,	"src/chart/axis/Abstract.js"
,	"src/chart/axis/Axis.js"
,	"src/chart/axis/Category.js"
,	"src/chart/axis/Gauge.js"
,	"src/chart/axis/Numeric.js"
,	"src/chart/axis/Radial.js"
,	"src/chart/axis/Time.js"
,	"src/chart/series/Series.js"
,	"src/chart/series/Cartesian.js"
,	"src/chart/series/Area.js"
,	"src/chart/series/Bar.js"
,	"src/chart/series/Column.js"
,	"src/chart/series/Gauge.js"
,	"src/chart/series/Line.js"
,	"src/chart/series/Pie.js"
,	"src/chart/series/Radar.js"
,	"src/chart/series/Scatter.js"
,	"src/layout/container/Table.js"
,	"src/container/ButtonGroup.js"
,	"src/container/Monitor.js"
,	"src/container/Viewport.js"
,	"src/data/IdGenerator.js"
,	"src/data/SortTypes.js"
,	"src/data/Types.js"
,	"src/data/Field.js"
,	"src/data/Errors.js"
,	"src/data/validations.js"
,	"src/data/Model.js"
,	"src/data/proxy/Server.js"
,	"src/data/proxy/Ajax.js"
,	"src/data/proxy/Client.js"
,	"src/data/proxy/Memory.js"
,	"src/util/LruCache.js"
,	"src/data/PageMap.js"
,	"src/data/Group.js"
,	"src/data/Store.js"
,	"src/data/reader/Array.js"
,	"src/data/ArrayStore.js"
,	"src/data/Batch.js"
,	"src/data/BufferStore.js"
,	"src/direct/Manager.js"
,	"src/data/proxy/Direct.js"
,	"src/data/DirectStore.js"
,	"src/data/JsonP.js"
,	"src/data/proxy/JsonP.js"
,	"src/data/JsonPStore.js"
,	"src/data/JsonStore.js"
,	"src/data/NodeInterface.js"
,	"src/data/NodeStore.js"
,	"src/data/Request.js"
,	"src/data/SequentialIdGenerator.js"
,	"src/data/Tree.js"
,	"src/data/TreeModel.js"
,	"src/data/TreeStore.js"
,	"src/data/UuidGenerator.js"
,	"src/data/reader/Xml.js"
,	"src/data/writer/Xml.js"
,	"src/data/XmlStore.js"
,	"src/data/association/BelongsTo.js"
,	"src/util/Inflector.js"
,	"src/data/association/HasMany.js"
,	"src/data/association/HasOne.js"
,	"src/data/proxy/WebStorage.js"
,	"src/data/proxy/LocalStorage.js"
,	"src/data/proxy/Rest.js"
,	"src/data/proxy/SessionStorage.js"
,	"src/dd/DDTarget.js"
,	"src/dd/DragTracker.js"
,	"src/dd/DragZone.js"
,	"src/dd/ScrollManager.js"
,	"src/dd/DropTarget.js"
,	"src/dd/Registry.js"
,	"src/dd/DropZone.js"
,	"src/direct/Event.js"
,	"src/direct/RemotingEvent.js"
,	"src/direct/ExceptionEvent.js"
,	"src/direct/JsonProvider.js"
,	"src/direct/PollingProvider.js"
,	"src/direct/RemotingMethod.js"
,	"src/direct/Transaction.js"
,	"src/direct/RemotingProvider.js"
,	"src/dom/Layer.js"
,	"src/rtl/dom/Layer.js"
,	"src/draw/Matrix.js"
,	"src/draw/SpriteDD.js"
,	"src/draw/Sprite.js"
,	"src/draw/Text.js"
,	"src/draw/engine/ImageExporter.js"
,	"src/draw/engine/Svg.js"
,	"src/draw/engine/SvgExporter.js"
,	"src/draw/engine/Vml.js"
,	"src/enums.js"
,	"src/flash/Component.js"
,	"src/form/action/Action.js"
,	"src/form/action/Load.js"
,	"src/form/action/Submit.js"
,	"src/util/ComponentDragger.js"
,	"src/window/Window.js"
,	"src/form/Labelable.js"
,	"src/form/field/Field.js"
,	"src/layout/component/field/Field.js"
,	"src/form/field/Base.js"
,	"src/form/field/VTypes.js"
,	"src/layout/component/field/Text.js"
,	"src/form/field/Text.js"
,	"src/layout/component/field/TextArea.js"
,	"src/form/field/TextArea.js"
,	"src/form/field/Display.js"
,	"src/layout/container/Anchor.js"
,	"src/window/MessageBox.js"
,	"src/form/Basic.js"
,	"src/rtl/layout/component/field/Text.js"
,	"src/form/FieldAncestor.js"
,	"src/layout/component/field/FieldContainer.js"
,	"src/form/FieldContainer.js"
,	"src/layout/container/CheckboxGroup.js"
,	"src/form/CheckboxManager.js"
,	"src/form/field/Checkbox.js"
,	"src/form/CheckboxGroup.js"
,	"src/rtl/form/field/Checkbox.js"
,	"src/rtl/layout/container/CheckboxGroup.js"
,	"src/form/FieldSet.js"
,	"src/form/Label.js"
,	"src/form/Panel.js"
,	"src/form/RadioManager.js"
,	"src/form/field/Radio.js"
,	"src/form/RadioGroup.js"
,	"src/form/action/DirectLoad.js"
,	"src/form/action/DirectSubmit.js"
,	"src/form/action/StandardSubmit.js"
,	"src/layout/component/field/Trigger.js"
,	"src/form/field/Trigger.js"
,	"src/form/field/Picker.js"
,	"src/selection/Model.js"
,	"src/selection/DataViewModel.js"
,	"src/view/AbstractView.js"
,	"src/view/View.js"
,	"src/layout/component/BoundList.js"
,	"src/toolbar/TextItem.js"
,	"src/form/field/Spinner.js"
,	"src/form/field/Number.js"
,	"src/toolbar/Paging.js"
,	"src/view/BoundList.js"
,	"src/view/BoundListKeyNav.js"
,	"src/layout/component/field/ComboBox.js"
,	"src/form/field/ComboBox.js"
,	"src/rtl/form/field/Spinner.js"
,	"src/rtl/form/field/Trigger.js"
,	"src/rtl/layout/component/field/Trigger.js"
,	"src/picker/Month.js"
,	"src/picker/Date.js"
,	"src/form/field/Date.js"
,	"src/form/field/FileButton.js"
,	"src/form/field/File.js"
,	"src/rtl/form/field/File.js"
,	"src/form/field/Hidden.js"
,	"src/picker/Color.js"
,	"src/layout/component/field/HtmlEditor.js"
,	"src/form/field/HtmlEditor.js"
,	"src/picker/Time.js"
,	"src/form/field/Time.js"
,	"src/grid/CellContext.js"
,	"src/grid/CellEditor.js"
,	"src/rtl/grid/CellEditor.js"
,	"src/grid/ColumnComponentLayout.js"
,	"src/grid/ColumnLayout.js"
,	"src/grid/ColumnManager.js"
,	"src/layout/container/Fit.js"
,	"src/panel/Table.js"
,	"src/util/CSS.js"
,	"src/view/TableLayout.js"
,	"src/view/NodeCache.js"
,	"src/view/Table.js"
,	"src/grid/View.js"
,	"src/grid/Panel.js"
,	"src/grid/plugin/BufferedRendererTableView.js"
,	"src/rtl/view/Table.js"
,	"src/grid/RowEditorButtons.js"
,	"src/grid/RowEditor.js"
,	"src/rtl/grid/RowEditor.js"
,	"src/grid/Scroller.js"
,	"src/view/DropZone.js"
,	"src/grid/ViewDropZone.js"
,	"src/grid/plugin/HeaderResizer.js"
,	"src/grid/header/DragZone.js"
,	"src/grid/header/DropZone.js"
,	"src/grid/plugin/HeaderReorderer.js"
,	"src/grid/header/Container.js"
,	"src/grid/column/Column.js"
,	"src/grid/column/Action.js"
,	"src/rtl/grid/column/Column.js"
,	"src/rtl/grid/plugin/HeaderResizer.js"
,	"src/grid/column/Boolean.js"
,	"src/grid/column/CheckColumn.js"
,	"src/grid/column/Date.js"
,	"src/grid/column/Number.js"
,	"src/grid/column/RowNumberer.js"
,	"src/grid/column/Template.js"
,	"src/grid/feature/Feature.js"
,	"src/grid/feature/AbstractSummary.js"
,	"src/grid/feature/GroupStore.js"
,	"src/grid/feature/Grouping.js"
,	"src/grid/feature/GroupingSummary.js"
,	"src/grid/feature/RowBody.js"
,	"src/grid/feature/RowWrap.js"
,	"src/grid/feature/Summary.js"
,	"src/grid/locking/HeaderContainer.js"
,	"src/grid/locking/View.js"
,	"src/grid/locking/Lockable.js"
,	"src/tree/View.js"
,	"src/grid/plugin/BufferedRendererTreeView.js"
,	"src/grid/plugin/BufferedRenderer.js"
,	"src/grid/plugin/Editing.js"
,	"src/grid/plugin/CellEditing.js"
,	"src/grid/plugin/DivRenderer.js"
,	"src/grid/plugin/DragDrop.js"
,	"src/grid/plugin/RowEditing.js"
,	"src/rtl/grid/plugin/RowEditing.js"
,	"src/grid/plugin/RowExpander.js"
,	"src/grid/property/Grid.js"
,	"src/grid/property/HeaderContainer.js"
,	"src/grid/property/Property.js"
,	"src/grid/property/Store.js"
,	"src/layout/ClassList.js"
,	"src/util/Queue.js"
,	"src/layout/ContextItem.js"
,	"src/layout/Context.js"
,	"src/rtl/layout/ContextItem.js"
,	"src/layout/SizePolicy.js"
,	"src/layout/component/FieldSet.js"
,	"src/layout/component/field/Slider.js"
,	"src/layout/container/Absolute.js"
,	"src/rtl/layout/container/Absolute.js"
,	"src/layout/container/Accordion.js"
,	"src/resizer/Splitter.js"
,	"src/resizer/BorderSplitter.js"
,	"src/layout/container/Border.js"
,	"src/rtl/layout/container/Border.js"
,	"src/layout/container/Card.js"
,	"src/layout/container/Column.js"
,	"src/rtl/layout/container/Column.js"
,	"src/layout/container/Form.js"
,	"src/menu/Item.js"
,	"src/menu/CheckItem.js"
,	"src/menu/KeyNav.js"
,	"src/menu/Separator.js"
,	"src/menu/Menu.js"
,	"src/menu/ColorPicker.js"
,	"src/menu/DatePicker.js"
,	"src/panel/Tool.js"
,	"src/resizer/SplitterTracker.js"
,	"src/resizer/BorderSplitterTracker.js"
,	"src/rtl/resizer/BorderSplitterTracker.js"
,	"src/rtl/resizer/SplitterTracker.js"
,	"src/resizer/Handle.js"
,	"src/resizer/ResizeTracker.js"
,	"src/rtl/resizer/ResizeTracker.js"
,	"src/resizer/Resizer.js"
,	"src/selection/CellModel.js"
,	"src/rtl/selection/CellModel.js"
,	"src/selection/RowModel.js"
,	"src/selection/TreeModel.js"
,	"src/rtl/selection/TreeModel.js"
,	"src/slider/Thumb.js"
,	"src/slider/Tip.js"
,	"src/slider/Multi.js"
,	"src/rtl/slider/Multi.js"
,	"src/tab/Tab.js"
,	"src/util/Point.js"
,	"src/tab/Bar.js"
,	"src/rtl/tab/Bar.js"
,	"src/tree/Column.js"
,	"src/rtl/tree/Column.js"
,	"src/selection/CheckboxModel.js"
,	"src/slider/Single.js"
,	"src/state/CookieProvider.js"
,	"src/state/LocalStorageProvider.js"
,	"src/tab/Panel.js"
,	"src/toolbar/Spacer.js"
,	"src/tree/Panel.js"
,	"src/view/DragZone.js"
,	"src/tree/ViewDragZone.js"
,	"src/tree/ViewDropZone.js"
,	"src/tree/plugin/TreeViewDragDrop.js"
,	"src/util/Cookies.js"
,	"src/util/Grouper.js"
,	"src/util/History.js"
]);
//}}}
//{{{ var: source for neptune theme.
var src_themes_neptune =
[
	"resources/ext-theme-neptune/overrides/Component.js"
,	"resources/ext-theme-neptune/overrides/panel/Panel.js"
,	"resources/ext-theme-neptune/overrides/toolbar/Toolbar.js"
,	"resources/ext-theme-neptune/overrides/layout/component/Dock.js"
,	"resources/ext-theme-neptune/overrides/container/ButtonGroup.js"
,	"resources/ext-theme-neptune/overrides/toolbar/Paging.js"
,	"resources/ext-theme-neptune/overrides/picker/Month.js"
,	"resources/ext-theme-neptune/overrides/form/field/HtmlEditor.js"
,	"resources/ext-theme-neptune/overrides/panel/Table.js"
,	"resources/ext-theme-neptune/overrides/grid/RowEditor.js"
,	"resources/ext-theme-neptune/overrides/grid/column/RowNumberer.js"
,	"resources/ext-theme-neptune/overrides/resizer/Splitter.js"
,	"resources/ext-theme-neptune/overrides/menu/Menu.js"
,	"resources/ext-theme-neptune/overrides/menu/Separator.js"
,	"resources/ext-theme-neptune/overrides/panel/Tool.js"
,	"resources/ext-theme-neptune/overrides/tab/Tab.js"
];
//}}}

//{{{ concat config
function exclude_rtl (f)
{
	if (f.indexOf ("/rtl/") === -1) {
		return true;
	}
	return false;
}
var remove_banners	=
{
	stripBanners	: true
}

var include_banners	=
{
	stripBanners	: false
}
//}}}
//{{{ string-replace debug config
var replace_debug	=
{
	replacements	:
	[{
		pattern			:/\s+?\/\/(\/|\s)?<debug>(.|\s)+?\/\/(\/|\s)?<\/debug>/g
	,	replacement		:""
	},{
		pattern			:/\s+?\/\/(\/|\s)?<debug error>(.|\s)+?\/\/(\/|\s)?<\/debug>/g
	,	replacement		:""
	}]
}
//}}}
//{{{ string-replace comment config
var replace_comment	=
{
	replacements	:
	[{
		pattern			:/\s+\/\*\*?(.|\s)+?\*\//g
	,	replacement		:""
/// this regex eat regex: /\//g
//					},{
//						pattern			:/\/\/(\/|\s)?(.*)\n?$/gm
//					,	replacement		:""
	}]
}
//}}}

module.exports = function (grunt) {
	grunt.initConfig ({
		pkg		: grunt.file.readJSON ("package.json")
		//{{{ task: create one single file.
	,	concat	:
		{
			options		: remove_banners
		,	test		:
			{
				files		:
				{
					"builds/test-dev.js"			: "src/Ext.js"
				}
			}
			// All file concatenate without banner (license).
			// Those will include comment and <debug> code.
		,	dev_all	:
			{
				files		:
				{
					"builds/ext-all-rtl-dev.js"		: src_all
				,	"builds/ext-core-dev.js"		: src_core
				,	"builds/ext-foundation-dev.js"	: src_foundation
				}
			}
		,	dev_all_min_rtl:
			{
				src			: src_all
			,	dest		: "builds/ext-all-dev.js"
			,	filter		: exclude_rtl
			}
			// add license to each concatenate and minimize files.
		,	test_add_license:
			{
				options		: include_banners
			,	files		:
				{
					"builds/test-dev.js"	:
					[
						"file-header.js"
					,	"builds/test-dev.js"
					]
				,	"builds/test-debug.js"	:
					[
						"file-header.js"
					,	"builds/test-debug.js"
					]
				,	"builds/test.js"		:
					[
						"file-header.js"
					,	"builds/test.js"
					]
				}
			}
		,	add_license	:
			{
				options		: include_banners
			,	files		:
				{
				// pure concat,
					"builds/ext-all-rtl-dev.js"		:
					[
						"file-header.js"
					,	"builds/ext-all-rtl-dev.js"
					]
				,	"builds/ext-all-dev.js"			:
					[
						"file-header.js"
					,	"builds/ext-all-dev.js"
					]
				,	"builds/ext-core-dev.js"		:
					[
						"file-header.js"
					,	"builds/ext-core-dev.js"
					]
				,	"builds/ext-foundation-dev.js"	:
					[
						"file-header.js"
					,	"builds/ext-foundation-dev.js"
					]
				// minus debug and comments,
				,	"builds/ext-all-rtl-debug.js"	:
					[
						"file-header.js"
					,	"builds/ext-all-rtl-debug.js"
					]
				,	"builds/ext-all-debug.js"		:
					[
						"file-header.js"
					,	"builds/ext-all-debug.js"
					]
				,	"builds/ext-core-debug.js"		:
					[
						"file-header.js"
					,	"builds/ext-core-debug.js"
					]
				,	"builds/ext-foundation-debug.js":
					[
						"file-header.js"
					,	"builds/ext-foundation-debug.js"
					]
				// minified.
				,	"builds/ext-all-rtl.js"			:
					[
						"file-header.js"
					,	"builds/ext-all-rtl.js"
					]
				,	"builds/ext-all.js"				:
					[
						"file-header.js"
					,	"builds/ext-all.js"
					]
				,	"builds/ext-core.js"			:
					[
						"file-header.js"
					,	"builds/ext-core.js"
					]
				,	"builds/ext-foundation.js"		:
					[
						"file-header.js"
					,	"builds/ext-foundation.js"
					]
				}
			}

		,	theme_neptune:
			{
				options		: remove_banners
			,	files		:
				{
					"resources/ext-theme-neptune/ext-theme-neptune-dev.js":src_themes_neptune
				}
			}

		,	theme_neptune_license:
			{
				options		: include_banners
			,	files		:
				{
					"resources/ext-theme-neptune/ext-theme-neptune-dev.js"		:
					[
						"file-header.js"
					,	"resources/ext-theme-neptune/ext-theme-neptune-dev.js"
					]
				,	"resources/ext-theme-neptune/ext-theme-neptune-debug.js"	:
					[
						"file-header.js"
					,	"resources/ext-theme-neptune/ext-theme-neptune-debug.js"
					]
				,	"resources/ext-theme-neptune/ext-theme-neptune.js"			:
					[
						"file-header.js"
					,	"resources/ext-theme-neptune/ext-theme-neptune.js"
					]
				}
			}
		}
		//}}}
//{{{ task: remove comments and debug code.
	,	"string-replace":
		{
			test	:
			{
				files	:
				{
					"builds/test-debug.js"	:"builds/test-dev.js"
				}
			,	options	:replace_debug
			}
		,	test_comment:
			{
				files		:
				{
					"builds/test-debug.js"	:"builds/test-debug.js"
				}
			,	options	: replace_comment
			}
			// remove <debug> and then <debug error> in source files.
		,	debug	:
			{
				files	:
				{
					"builds/ext-all-rtl-debug.js"		:"builds/ext-all-rtl-dev.js"
				,	"builds/ext-all-debug.js"			:"builds/ext-all-dev.js"
				,	"builds/ext-core-debug.js"			:"builds/ext-core-dev.js"
				,	"builds/ext-foundation-debug.js"	:"builds/ext-foundation-dev.js"
				}
			,	options	: replace_debug
			}
			// remove multi line comments (/* ... */) in source files.
		,	comment	:
			{
				files	:
				{
					"builds/test-debug.js"			:"builds/test-debug.js"
				,	"builds/ext-all-rtl-debug.js"	:"builds/ext-all-rtl-debug.js"
				,	"builds/ext-all-debug.js"		:"builds/ext-all-debug.js"
				,	"builds/ext-core-debug.js"		:"builds/ext-core-debug.js"
				,	"builds/ext-foundation-debug.js":"builds/ext-foundation-debug.js"
				}
			,	options	: replace_comment
			}
		,	theme_neptune_debug	:
			{
				files	:
				{
					"resources/ext-theme-neptune/ext-theme-neptune-debug.js":"resources/ext-theme-neptune/ext-theme-neptune-dev.js"
				}
			,	options	: replace_debug
			}
		,	theme_neptune_comment:
			{
				files	:
				{
					"resources/ext-theme-neptune/ext-theme-neptune-debug.js":"resources/ext-theme-neptune/ext-theme-neptune-debug.js"
				}
			,	options	: replace_comment
			}
		}
//}}}
//{{{ task: minimize.
	,	uglify	:
		{
			options	:
			{
				mangle				:true
			,	preserveComments	:false
			}
		,	test	:
			{
				files	:
				{
					"builds/test.js"			:"builds/test-debug.js"
				}
			}
		,	all		:
			{
				files	:
				{
					"builds/ext-all-rtl.js"		:"builds/ext-all-rtl-debug.js"
				,	"builds/ext-all.js"			:"builds/ext-all-debug.js"
				,	"builds/ext-core.js"		:"builds/ext-core-debug.js"
				,	"builds/ext-foundation.js"	:"builds/ext-foundation-debug.js"
				}
			}
		,	theme_neptune:
			{
				files	:
				{
					"resources/ext-theme-neptune/ext-theme-neptune.js":"resources/ext-theme-neptune/ext-theme-neptune-debug.js"
				}
			}
		}
//}}}
//{{{ task: create symlink.
	,	symlink	:
		{
			options	:
			{
				overwrite	:true
			}
		,	all		:
			{
				files	:
				[{
					expand		:true
				,	overwrite	:true
				,	cwd			:"builds"
				,	src			:
					[
						"ext-all-dev.js"
					,	"ext-all-debug.js"
					,	"ext-all.js"
					]
				,	dest		:"./"
				},{
					src		: "builds/ext-core-dev.js"
				,	dest	: "ext-dev.js"
				},{
					src		: "builds/ext-core-debug.js"
				,	dest	: "ext-debug.js"
				},{
					src		: "builds/ext-core.js"
				,	dest	: "ext.js"
				}]
			}
		}
//}}}
//{{{ task: generate css.
	,	sass	:
		{
			theme_debug:
			{
				options	:
				{
					style	:"expand"
				,	compass	:true
				,	quiet	:true
				,	require	:
					[
						"./resources/ext-theme-base/sass/utils.rb"
					]
				}
			,	files	:
				{
//					"resources/ext-theme-base/ext-theme-base-all-rtl-debug.css":"resources/ext-theme-base/ext-theme-base-all-rtl-debug.scss"
//				,	"resources/ext-theme-base/ext-theme-base-all-debug.css":"resources/ext-theme-base/ext-theme-base-all-debug.scss"
//				,	"resources/ext-theme-neutral/ext-theme-neutral-all-rtl-debug.css":"resources/ext-theme-neutral/ext-theme-neutral-all-rtl-debug.scss"
//				,	"resources/ext-theme-neutral/ext-theme-neutral-all-debug.css":"resources/ext-theme-neutral/ext-theme-neutral-all-debug.scss"
					"resources/ext-theme-classic/ext-theme-classic-all-rtl-debug.css":"resources/ext-theme-classic/ext-theme-classic-all-rtl-debug.scss"
				,	"resources/ext-theme-classic/ext-theme-classic-all-debug.css":"resources/ext-theme-classic/ext-theme-classic-all-debug.scss"
				,	"resources/ext-theme-gray/ext-theme-gray-all-rtl-debug.css":"resources/ext-theme-gray/ext-theme-gray-all-rtl-debug.scss"
				,	"resources/ext-theme-gray/ext-theme-gray-all-debug.css":"resources/ext-theme-gray/ext-theme-gray-all-debug.scss"
				,	"resources/ext-theme-access/ext-theme-access-all-rtl-debug.css":"resources/ext-theme-access/ext-theme-access-all-rtl-debug.scss"
				,	"resources/ext-theme-access/ext-theme-access-all-debug.css":"resources/ext-theme-access/ext-theme-access-all-debug.scss"
				,	"resources/ext-theme-neptune/ext-theme-neptune-all-rtl-debug.css":"resources/ext-theme-neptune/ext-theme-neptune-all-rtl-debug.scss"
				,	"resources/ext-theme-neptune/ext-theme-neptune-all-debug.css":"resources/ext-theme-neptune/ext-theme-neptune-all-debug.scss"
				}
			}

		,	theme:
			{
				options:
				{
					style	:"compressed"
				,	compass	:true
				,	quiet	:true
				,	require	:
					[
						"./resources/ext-theme-base/sass/utils.rb"
					]
				}
			,	files	:
				{
//					"resources/ext-theme-base/ext-theme-base-all-rtl.css":"resources/ext-theme-base/ext-theme-base-all-rtl-debug.scss"
//				,	"resources/ext-theme-base/ext-theme-base-all.css":"resources/ext-theme-base/ext-theme-base-all-debug.scss"
//				,	"resources/ext-theme-neutral/ext-theme-neutral-all-rtl.css":"resources/ext-theme-neutral/ext-theme-neutral-all-rtl-debug.scss"
//				,	"resources/ext-theme-neutral/ext-theme-neutral-all.css":"resources/ext-theme-neutral/ext-theme-neutral-all-debug.scss"
					"resources/ext-theme-classic/ext-theme-classic-all-rtl.css":"resources/ext-theme-classic/ext-theme-classic-all-rtl-debug.scss"
				,	"resources/ext-theme-classic/ext-theme-classic-all.css":"resources/ext-theme-classic/ext-theme-classic-all-debug.scss"
				,	"resources/ext-theme-gray/ext-theme-gray-all-rtl.css":"resources/ext-theme-gray/ext-theme-gray-all-rtl-debug.scss"
				,	"resources/ext-theme-gray/ext-theme-gray-all.css":"resources/ext-theme-gray/ext-theme-gray-all-debug.scss"
				,	"resources/ext-theme-access/ext-theme-access-all-rtl.css":"resources/ext-theme-access/ext-theme-access-all-rtl-debug.scss"
				,	"resources/ext-theme-access/ext-theme-access-all.css":"resources/ext-theme-access/ext-theme-access-all-debug.scss"
				,	"resources/ext-theme-neptune/ext-theme-neptune-all-rtl.css":"resources/ext-theme-neptune/ext-theme-neptune-all-rtl-debug.scss"
				,	"resources/ext-theme-neptune/ext-theme-neptune-all.css":"resources/ext-theme-neptune/ext-theme-neptune-all-debug.scss"
				}
			}
		}
//}}}
//{{{ task: clean
	,	clean	:
		[
			"builds/"
		,	"docs/"
		]
//}}}
	});

//{{{ Load the plugins.
	grunt.loadNpmTasks ("grunt-contrib-concat");
	grunt.loadNpmTasks ("grunt-contrib-uglify");
	grunt.loadNpmTasks ("grunt-string-replace");
	grunt.loadNpmTasks ("grunt-contrib-clean");
	grunt.loadNpmTasks ("grunt-contrib-symlink");
	grunt.loadNpmTasks ("grunt-contrib-sass");
//}}}

//{{{ Register tasks.
	grunt.registerTask ("test",
		"Test grunt script.",
		[
			"concat:test"
		,	"string-replace:test"
		,	"string-replace:test_comment"
		,	"uglify:test"
		,	"concat:test_add_license"
		]);

	grunt.registerTask ("combine",
		[
			"concat:dev_all"
		,	"concat:dev_all_min_rtl"
		]);

	grunt.registerTask ("strip",
		[
			"string-replace:debug"
		,	"string-replace:comment"
		]);

	grunt.registerTask ("themes",
		[
			"sass"
		,	"concat:theme_neptune"
		,	"string-replace:theme_neptune_debug"
		,	"string-replace:theme_neptune_comment"
		,	"uglify:theme_neptune"
		,	"concat:theme_neptune_license"
		]);

	grunt.registerTask ("default",
		[
			"combine"
		,	"strip"
		,	"uglify:all"
		,	"concat:add_license"
		,	"themes"
		]);
//}}}
};
